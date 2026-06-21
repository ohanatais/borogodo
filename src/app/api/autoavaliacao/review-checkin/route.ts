import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { buildCaptureContext } from '@/lib/ai/extraction/context'
import { captureAndReflect } from '@/lib/ai/extraction/captureAndReflect'
import { saveEntries } from '@/lib/db/entries'
import { fireAndForget, maybeRegenerateMirror, triggerProactiveInsight, triggerEnrichmentNudge } from '@/lib/ai/extraction/jobs'
import { advanceReviewAnchor } from '@/lib/autoavaliacao/reviewCheckIn'
import { errorMessage, NoExtractableContentError } from '@/lib/errors'
import { logger } from '@/lib/log'

const MAX_TEXT_LENGTH = 20_000

const checkInSchema = z.object({
  text: z.string().trim().min(3).max(MAX_TEXT_LENGTH),
})

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

/**
 * POST /api/autoavaliacao/review-checkin (019, US2 follow-up) — fecha o loop da revisão. A resposta da
 * pessoa ao "como foi?" vira um REGISTRO (reusa o pipeline de captura: extração + entries + jobs de
 * espelho/insight), alimentando recap/espelho/próxima autoavaliação — sem tabela nova. Depois AVANÇA a
 * `review_cycle_anchor` para o próximo ciclo (evita re-nag). Auth-first; `user_id` da sessão; RLS reforça.
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

  const parsed = checkInSchema.safeParse(body)
  if (!parsed.success) return jsonError('invalid_request', 400)

  try {
    // A resposta vira registro pelo mesmo caminho do composer (extração Haiku + dedup + RLS).
    const context = await buildCaptureContext(supabase, user.id)
    const { entries, reflection } = await captureAndReflect(parsed.data.text, 'text', context)
    const saved = await saveEntries(supabase, user.id, entries)

    await advanceAnchor(supabase, user.id)
    dispatchAsyncJobs(user.id)

    return NextResponse.json({ entries: saved, reflection }, { status: 200 })
  } catch (error: unknown) {
    if (error instanceof NoExtractableContentError) {
      return jsonError('no_content', 422)
    }
    logger.error('review check-in failed', { message: errorMessage(error) })
    return jsonError('internal_error', 500)
  }
}

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

/** Reagenda a próxima revisão a partir da recorrência da pessoa. Sem recorrência → não toca a âncora. */
async function advanceAnchor(supabase: SupabaseServerClient, userId: string): Promise<void> {
  const { data } = await supabase
    .from('profiles')
    .select('review_cycle_months, review_cycle_anchor')
    .eq('id', userId)
    .maybeSingle()

  const profile = data as { review_cycle_months?: number | null; review_cycle_anchor?: string | null } | null
  if (!profile?.review_cycle_months || !profile.review_cycle_anchor) return

  const next = advanceReviewAnchor(profile.review_cycle_anchor, profile.review_cycle_months)
  await supabase.from('profiles').update({ review_cycle_anchor: next }).eq('id', userId)
}

function dispatchAsyncJobs(userId: string): void {
  fireAndForget('triggerProactiveInsight', triggerProactiveInsight(userId))
  fireAndForget('maybeRegenerateMirror', maybeRegenerateMirror(userId))
  fireAndForget('triggerEnrichmentNudge', triggerEnrichmentNudge(userId))
}
