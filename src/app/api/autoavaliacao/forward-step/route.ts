import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { getSelfAssessmentBody, saveForwardStep } from '@/lib/db/drafts'
import { forwardStep, ForwardStepFailedError } from '@/lib/ai/content/forwardStep'
import { errorMessage } from '@/lib/errors'
import { logger } from '@/lib/log'

// v1: só plano de ação (GROW Will + 70-20-10). prep de 1:1 (one_on_one_prep) é fast-follow.
const forwardStepRequestSchema = z.object({
  draftId: z.string().min(1).max(40),
  kind: z.enum(['action_plan']),
})

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

/**
 * POST /api/autoavaliacao/forward-step (019, US2) — oferta única do passo-pra-frente. Auth-first; lê o
 * `body` da autoavaliação escopado por `user_id` (a IA nunca vê texto de outro usuário); gera o plano
 * ancorado SÓ no que a pessoa escreveu (anti-invenção bloqueante no `forwardStep`) e persiste em
 * `drafts.qa.forwardStep`. Inventou/degradou → 422, nada é persistido.
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

  const parsed = forwardStepRequestSchema.safeParse(body)
  if (!parsed.success) return jsonError('invalid_request', 400)

  const assessmentBody = await getSelfAssessmentBody(supabase, user.id, parsed.data.draftId)
  if (!assessmentBody) return jsonError('draft_not_found', 404)

  try {
    const step = await forwardStep({ body: assessmentBody })
    await saveForwardStep(supabase, user.id, parsed.data.draftId, step)
    return NextResponse.json(step, { status: 200 })
  } catch (error: unknown) {
    if (error instanceof ForwardStepFailedError) {
      return jsonError('generation_failed', 422)
    }

    logger.error('forward step failed', { message: errorMessage(error) })
    return jsonError('internal_error', 500)
  }
}
