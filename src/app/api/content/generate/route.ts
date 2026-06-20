import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { loadSeedEvidence } from '@/lib/ai/content/loadSeed'
import { generateDraft } from '@/lib/ai/content/generateDraft'
import { getVoiceProfile } from '@/lib/db/drafts'
import { errorMessage, GenerationFailedError } from '@/lib/errors'
import { logger } from '@/lib/log'

const generateRequestSchema = z.object({
  format: z.enum(['post', 'impact_summary', 'mini_bio', 'self_assessment']),
  seedType: z.enum(['entry', 'theme', 'project', 'period']),
  seedRef: z.string().min(1),
  angle: z.string().max(200).nullish(),
  adjust: z.enum(['mais_curto', 'menos_formal', 'tira_jargao']).nullish(),
})

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

/**
 * POST /api/content/generate — gera 2 variações efêmeras (Zod + ruleset anti-IA), sem persistir.
 * Auth-first; seedRef validado como do usuário antes do LLM; contexto de IA só do próprio usuário.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('unauthorized', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('invalid_request', 400)
  }

  const parsed = generateRequestSchema.safeParse(body)
  if (!parsed.success) return jsonError('invalid_request', 400)

  const { format, seedType, seedRef, angle, adjust } = parsed.data

  try {
    const seed = await loadSeedEvidence(supabase, user.id, seedType, seedRef)
    if (!seed) return jsonError('seed_not_found', 404)

    // Base limitada (019): um período sem nenhuma evidência não autoriza o motor a inventar para
    // preencher. Em vez de um 422 genérico (que parece bug), devolvemos um sinal honesto que a UI
    // traduz em "ainda há pouco aqui pra colher — registre e volte". Só para `period`: os demais
    // seeds sempre carregam ao menos a entrada/tema/projeto que os originou.
    if (seedType === 'period' && seed.evidence.length === 0) {
      return NextResponse.json({ limited: true }, { status: 200 })
    }

    const voiceProfile = await getVoiceProfile(supabase, user.id)

    const { variants } = await generateDraft({
      format,
      seedSummary: seed.seedSummary,
      evidence: seed.evidence,
      voiceProfile,
      angle: angle ?? null,
      adjust: adjust ?? null,
    })

    return NextResponse.json({ variants }, { status: 200 })
  } catch (error: unknown) {
    if (error instanceof GenerationFailedError) {
      return jsonError('generation_failed', 422)
    }

    logger.error('content generation failed', { message: errorMessage(error) })
    return jsonError('internal_error', 500)
  }
}
