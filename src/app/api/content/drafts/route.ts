import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { insertDraft, listDrafts } from '@/lib/db/drafts'
import { errorMessage } from '@/lib/errors'
import { logger } from '@/lib/log'

const MAX_BODY_CHARS = 10000
const MAX_PAGE_LIMIT = 20

const createDraftSchema = z.object({
  format: z.enum(['post', 'impact_summary', 'mini_bio', 'self_assessment']),
  seedType: z.enum(['entry', 'theme', 'project', 'period']),
  seedRef: z.string().max(500).nullable(),
  angle: z.string().max(200).default(''),
  body: z.string().min(1).max(MAX_BODY_CHARS),
  status: z.enum(['generated', 'edited']),
  qa: z.record(z.string(), z.unknown()).default({}),
})

const listQuerySchema = z.object({
  cursor: z.string().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).optional(),
  status: z.enum(['ativos', 'copiados', 'arquivados']).optional(),
  format: z.enum(['post', 'impact_summary', 'mini_bio', 'self_assessment']).optional(),
})

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

/**
 * GET /api/content/drafts — lista paginada/filtrada dos rascunhos do usuário (hub da Presença, 014).
 * Auth-first; a RLS de `drafts` reforça o escopo. `limit` com teto (≤ 20); `status=ativos` (default)
 * nunca devolve arquivados. Params inválidos → 400. Devolve `{ items, nextCursor }`.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('unauthorized', 401)

  const params = Object.fromEntries(new URL(request.url).searchParams)
  const parsed = listQuerySchema.safeParse(params)
  if (!parsed.success) return jsonError('invalid_request', 400)

  try {
    const page = await listDrafts(supabase, user.id, parsed.data)
    return NextResponse.json(page, { status: 200 })
  } catch (error: unknown) {
    logger.error('draft list failed', { message: errorMessage(error) })
    return jsonError('internal_error', 500)
  }
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
