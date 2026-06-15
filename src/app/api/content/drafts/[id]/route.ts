import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { updateDraft } from '@/lib/db/drafts'
import { errorMessage } from '@/lib/errors'
import { logger } from '@/lib/log'

const MAX_BODY_CHARS = 10000

const patchDraftSchema = z
  .object({
    body: z.string().min(1).max(MAX_BODY_CHARS).optional(),
    status: z.enum(['generated', 'edited', 'copied', 'discarded']).optional(),
    voiceFeedback: z.enum(['soa', 'nao_soa']).optional(),
  })
  .refine((v) => v.body !== undefined || v.status !== undefined || v.voiceFeedback !== undefined, {
    message: 'empty patch',
  })

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

/**
 * PATCH /api/content/drafts/[id] — atualiza body/status/voiceFeedback do próprio rascunho (US4,
 * FR-016). Não regera nada no v1. Um id de outro usuário (ou inexistente) volta 404, não 403, para
 * não confirmar a existência de recursos alheios (constituição I). A RLS é a barreira real.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('unauthorized', 401)

  const { id } = await params
  if (!id) return jsonError('invalid_request', 400)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('invalid_request', 400)
  }

  const parsed = patchDraftSchema.safeParse(body)
  if (!parsed.success) return jsonError('invalid_request', 400)

  try {
    const draft = await updateDraft(supabase, user.id, id, parsed.data)
    if (!draft) return jsonError('not_found', 404)
    return NextResponse.json({ draft }, { status: 200 })
  } catch (error: unknown) {
    logger.error('draft update failed', { message: errorMessage(error) })
    return jsonError('internal_error', 500)
  }
}
