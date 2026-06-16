import { complete as defaultComplete } from '@/lib/ai/client'
import { RECALIBRATE_SYSTEM_PROMPT, buildRecalibrateUserPrompt } from '@/lib/ai/content/prompts/recalibrate'
import type { CompleteFn } from '@/lib/ai/content/generateDraft'
import type { VoiceProfile, VoiceSignal } from '@/types/content'

const MAX_TOKENS = 512

/**
 * Quantos "não soa" acumulados disparam a SUGESTÃO de recalibrar. Conservador de propósito (FR-002 +
 * edge "sinal insuficiente"): nunca sugerir do nada. Constante nomeada para ajuste fácil.
 */
export const RECALIBRATE_NAO_SOA_THRESHOLD = 3

export interface RecalibrateVoiceInput {
  /** Perfil atual; a recalibração funde o feedback nele e preserva as amostras explícitas. */
  existing: VoiceProfile | null
  /** Corpos dos rascunhos marcados "soa" (estilo a reforçar). */
  soaSamples: string[]
  /** Corpos dos rascunhos marcados "nao_soa" (estilo a evitar). */
  naoSoaSamples: string[]
}

/**
 * Decide se o produto deve SUGERIR recalibrar a voz: só com "não soa" acumulado acima do limiar E com
 * sinal novo desde a última recalibração (compara `lastFeedbackAt` com `voice_profile.updatedAt`).
 * Sem voz ainda, basta atingir o limiar. Determinístico, sem IA — roda no servidor (página da Presença).
 */
export function shouldSuggestRecalibration(signal: VoiceSignal, voice: VoiceProfile | null): boolean {
  if (signal.naoSoaCount < RECALIBRATE_NAO_SOA_THRESHOLD) return false
  if (!voice) return true
  if (!signal.lastFeedbackAt) return false
  // ISO 8601 em UTC compara corretamente como string.
  return signal.lastFeedbackAt > voice.updatedAt
}

/**
 * Recalibra a voz a partir do feedback acumulado (US1, FR-003). Funde os rascunhos que soaram / não
 * soaram com a voz atual e devolve um novo `inferredSummary`, PRESERVANDO as amostras explícitas
 * (âncora de verdade) e o tone/lengthPref. `updatedAt` é renovado. Pure + LLM injetável (default =
 * client real). Sem sinal nenhum, é no-op: devolve o perfil intacto (a rota nunca chama sem sinal,
 * mas a função é defensiva). NUNCA é chamada sem consentimento explícito — isso é responsabilidade da rota.
 */
export async function recalibrateVoice(
  input: RecalibrateVoiceInput,
  complete: CompleteFn = defaultComplete
): Promise<VoiceProfile> {
  const { existing } = input
  const samples = existing?.samples ?? []

  const hasSignal = input.soaSamples.length > 0 || input.naoSoaSamples.length > 0
  if (!hasSignal) {
    return existing ?? { samples: [], updatedAt: new Date().toISOString() }
  }

  const raw = await complete({
    role: 'synthesis',
    system: RECALIBRATE_SYSTEM_PROMPT,
    user: buildRecalibrateUserPrompt({
      existing,
      samples,
      soaSamples: input.soaSamples,
      naoSoaSamples: input.naoSoaSamples,
    }),
    maxTokens: MAX_TOKENS,
  })

  const inferredSummary = raw.trim()
  if (!inferredSummary) {
    // O LLM não devolveu síntese: falhar honestamente, em vez de gravar voz vazia, avançar o
    // `updatedAt` (suprimindo futuras sugestões) e ainda mostrar "pronto" à pessoa. A rota mapeia 500.
    throw new Error('Recalibração não produziu uma síntese de voz')
  }

  return {
    tone: existing?.tone,
    lengthPref: existing?.lengthPref,
    samples, // preservadas — feedback ruidoso nunca apaga a âncora de verdade (edge case da spec)
    inferredSummary,
    updatedAt: new Date().toISOString(),
  }
}
