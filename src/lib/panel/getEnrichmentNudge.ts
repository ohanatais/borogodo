import { getSupabaseAdmin } from '@/lib/db/supabaseAdmin'
import { insertProactiveInsight, countUnseenInsights } from '@/lib/db/insights'
import type { ProactiveInsight } from '@/types/insight'

interface LeanEntry {
  id: string
  what_i_did: string
  metric: string | null
  impact: string | null
}

function isLean(entry: LeanEntry): boolean {
  return !entry.metric && !entry.impact
}

function alreadyHasNudge(entryId: string, existingInsights: ProactiveInsight[]): boolean {
  return existingInsights.some(
    (i) => i.type === 'enrichment_nudge' && i.entry_ids.includes(entryId)
  )
}

/**
 * Finds the first lean entry (no metric/impact) without an existing nudge and creates
 * ONE enrichment_nudge insight for it. Returns the created insight or null.
 *
 * Guarantees: at most one nudge is generated per call, and only if no other
 * unseen enrichment_nudge exists for the user.
 */
export async function getEnrichmentNudge(
  userId: string,
  entries: LeanEntry[],
  existingInsights: ProactiveInsight[]
): Promise<ProactiveInsight | null> {
  const admin = getSupabaseAdmin()

  const unseenCount = await countUnseenInsights(admin, userId)
  if (unseenCount > 0) return null

  const target = entries.find((e) => isLean(e) && !alreadyHasNudge(e.id, existingInsights))
  if (!target) return null

  return insertProactiveInsight(admin, {
    userId,
    type: 'enrichment_nudge',
    headline: 'Pergunta rápida',
    body: 'Teve algum número ou prazo nisso?',
    entryIds: [target.id],
  })
}
