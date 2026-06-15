import { complete as defaultComplete } from '@/lib/ai/client'
import { VOICE_SYSTEM_PROMPT, buildVoiceUserPrompt } from '@/lib/ai/content/prompts/voice'
import type { CompleteFn } from '@/lib/ai/content/generateDraft'
import type { LengthPref, VoiceProfile } from '@/types/content'

const MAX_SAMPLES = 2
const MAX_TOKENS = 512

export interface BuildVoiceProfileInput {
  /** `raw_content` das capturas do usuário — fonte da inferência de estilo. */
  rawContents: string[]
  /** Perfil atual (para fundir samples/tom e preservar o summary se não houver novo material). */
  existing: VoiceProfile | null
  /** Amostras coladas pelo usuário (0 a 2); se ausentes, mantém as do perfil atual. */
  samples?: string[]
  tone?: string | null
  lengthPref?: LengthPref | null
}

/** Normaliza: corta espaços, descarta vazias, limita a 2 (FR-001: 1–2 amostras). */
function normalizeSamples(samples: string[]): string[] {
  return samples
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, MAX_SAMPLES)
}

function hasMaterial(rawContents: string[], samples: string[]): boolean {
  return samples.length > 0 || rawContents.some((c) => c.trim().length > 0)
}

/**
 * Constrói o perfil de voz (T014): infere o `inferredSummary` do `raw_content` das capturas e funde
 * com as amostras explícitas (calibração híbrida, FR-002). O resultado é cacheado no JSONB pela
 * rota (PUT /api/content/voice) para não reprocessar o raw_content a cada geração.
 * Pure + LLM injetável (default = client real); sem material para inferir, mantém o summary anterior.
 */
export async function buildVoiceProfile(
  input: BuildVoiceProfileInput,
  complete: CompleteFn = defaultComplete
): Promise<VoiceProfile> {
  const samples = normalizeSamples(input.samples ?? input.existing?.samples ?? [])

  let inferredSummary = input.existing?.inferredSummary
  if (hasMaterial(input.rawContents, samples)) {
    const raw = await complete({
      role: 'synthesis',
      system: VOICE_SYSTEM_PROMPT,
      user: buildVoiceUserPrompt(input.rawContents, samples),
      maxTokens: MAX_TOKENS,
    })
    inferredSummary = raw.trim() || inferredSummary
  }

  return {
    tone: input.tone ?? input.existing?.tone,
    lengthPref: input.lengthPref ?? input.existing?.lengthPref,
    samples,
    inferredSummary,
    updatedAt: new Date().toISOString(),
  }
}
