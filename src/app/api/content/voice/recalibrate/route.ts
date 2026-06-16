import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { recalibrateVoice, shouldSuggestRecalibration } from '@/lib/ai/content/recalibrateVoice'
import { getVoiceFeedbackData, getVoiceSignal, getVoiceProfile, upsertVoiceProfile } from '@/lib/db/drafts'
import { errorMessage } from '@/lib/errors'
import { logger } from '@/lib/log'

const recalibrateRequestSchema = z.object({
  /** Consentimento explícito: sem `apply: true` a rota só LÊ o sinal, nunca muda a voz (FR-002). */
  apply: z.boolean().optional().default(false),
})

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

/**
 * POST /api/content/voice/recalibrate — refino de voz híbrido e COM CONSENTIMENTO (US1).
 *
 * - `apply: false` (default): modo SUGERIR. Lê o sinal acumulado de "soa"/"nao_soa" e devolve se
 *   vale recalibrar. Não muda nada.
 * - `apply: true`: modo APLICAR. Só com consentimento explícito no payload, recalibra o
 *   `voice_profile` a partir do feedback (preservando as amostras) e persiste.
 *
 * Auth-first; contexto de IA só do próprio usuário; RLS reforça o escopo. A voz NUNCA muda sem
 * `apply: true` — o consentimento é a porta de entrada da mutação.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('unauthorized', 401)

  let raw: unknown = {}
  try {
    raw = await request.json()
  } catch {
    // Corpo vazio é válido: equivale ao modo "sugerir".
  }

  const parsed = recalibrateRequestSchema.safeParse(raw ?? {})
  if (!parsed.success) return jsonError('invalid_request', 400)

  try {
    // Modo sugerir: só o sinal (sem trazer os corpos dos rascunhos à toa).
    if (!parsed.data.apply) {
      const [existing, signal] = await Promise.all([
        getVoiceProfile(supabase, user.id),
        getVoiceSignal(supabase, user.id),
      ])
      return NextResponse.json(
        { suggest: shouldSuggestRecalibration(signal, existing), signal },
        { status: 200 }
      )
    }

    // Modo aplicar (consentimento explícito): precisa dos corpos como insumo do LLM.
    const [existing, feedback] = await Promise.all([
      getVoiceProfile(supabase, user.id),
      getVoiceFeedbackData(supabase, user.id),
    ])

    // Aplicar sem nenhum sinal seria recalibrar do nada — no-op honesto, devolve a voz intacta.
    if (feedback.soa.length === 0 && feedback.naoSoa.length === 0) {
      return NextResponse.json({ recalibrated: false, voiceProfile: existing }, { status: 200 })
    }

    const recalibrated = await recalibrateVoice({
      existing,
      soaSamples: feedback.soa,
      naoSoaSamples: feedback.naoSoa,
    })
    const saved = await upsertVoiceProfile(supabase, user.id, recalibrated)

    return NextResponse.json({ recalibrated: true, voiceProfile: saved }, { status: 200 })
  } catch (error: unknown) {
    logger.error('voice recalibration failed', { message: errorMessage(error) })
    return jsonError('internal_error', 500)
  }
}
