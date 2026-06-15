import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { insertDraft } from '@/lib/db/drafts'
import { errorMessage } from '@/lib/errors'
import { logger } from '@/lib/log'

const MAX_BODY_CHARS = 10000

const createDraftSchema = z.object({
  format: z.enum(['post', 'impact_summary']),
  seedType: z.enum(['entry', 'theme', 'project']),
  seedRef: z.string().max(500).nullable(),
  angle: z.string().max(200).default(''),
  body: z.string().min(1).max(MAX_BODY_CHARS),
  status: z.enum(['generated', 'edited']),
  qa: z.record(z.string(), z.unknown()).default({}),
})

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

/**
 * POST /api/content/drafts — persiste o rascunho escolhido (US4, FR-015). Auth-first; o `user_id`
 * vem da sessão (nunca do payload) e a RLS reforça o escopo. Devolve o Draft já em camelCase, sem
 * vazar `user_id`/`qa`.
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

  const parsed = createDraftSchema.safeParse(body)
  if (!parsed.success) return jsonError('invalid_request', 400)

  try {
    const draft = await insertDraft(supabase, user.id, parsed.data)
    return NextResponse.json({ draft }, { status: 201 })
  } catch (error: unknown) {
    logger.error('draft persist failed', { message: errorMessage(error) })
    return jsonError('internal_error', 500)
  }
}
