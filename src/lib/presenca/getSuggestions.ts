import type { createServerClient } from '@/lib/db/supabase/server'
import type { ContentSuggestion, DraftFormat } from '@/types/content'
import { getLatestSnapshot } from '@/lib/db/mirror'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

const MAX_SUGGESTIONS = 3
const STRONG_ENTRY_SCAN = 20
const POST_ONLY: DraftFormat[] = ['post']
const POST_AND_SUMMARY: DraftFormat[] = ['post', 'impact_summary']

interface PendingNudgeRow {
  id: string
  headline: string
  entry_ids: string[] | null
}

interface StrongEntryRow {
  id: string
  what_i_did: string
  impact: string | null
  metric: string | null
}

/** Nudges `content_opportunity` ainda não-vistos — viram a primeira leva de sugestões. */
async function loadPendingNudges(supabase: SupabaseServerClient, userId: string): Promise<PendingNudgeRow[]> {
  const { data } = await supabase
    .from('proactive_insights')
    .select('id, headline, entry_ids')
    .eq('user_id', userId)
    .eq('type', 'content_opportunity')
    .eq('seen', false)
    .order('generated_at', { ascending: false })

  return (data ?? []) as PendingNudgeRow[]
}

/** Conjunto de seeds que já viraram rascunho — para não sugerir o que a pessoa já trabalhou. */
async function loadDraftedRefs(supabase: SupabaseServerClient, userId: string): Promise<Set<string>> {
  const { data } = await supabase.from('drafts').select('seed_ref').eq('user_id', userId)
  return new Set(
    ((data ?? []) as { seed_ref: string | null }[])
      .map((d) => d.seed_ref)
      .filter((r): r is string => Boolean(r))
  )
}

/** Entradas recentes com sinal forte (impacto/métrica) — pontos de partida determinísticos. */
async function loadStrongEntries(supabase: SupabaseServerClient, userId: string): Promise<StrongEntryRow[]> {
  const { data } = await supabase
    .from('entries')
    .select('id, what_i_did, impact, metric')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(STRONG_ENTRY_SCAN)

  return ((data ?? []) as StrongEntryRow[]).filter((e) => Boolean(e.impact?.trim()) || Boolean(e.metric?.trim()))
}

/**
 * Sugestões da faixa "Sugestões pra você" (US4) — projeção de leitura, **sem chamada de IA**: cruza os
 * nudges `content_opportunity` pendentes com pontos de partida determinísticos (temas do espelho e
 * entradas fortes que ainda não viraram rascunho). Prioriza nudges, depois temas, depois entradas;
 * dedupe por `seedRef` e teto de {@link MAX_SUGGESTIONS}. Devolve `[]` quando não há material (a faixa
 * some). Tudo escopado por `user_id` (RLS reforça).
 */
export async function getSuggestions(supabase: SupabaseServerClient, userId: string): Promise<ContentSuggestion[]> {
  const [nudges, snapshot, strongEntries, draftedRefs] = await Promise.all([
    loadPendingNudges(supabase, userId),
    getLatestSnapshot(supabase, userId),
    loadStrongEntries(supabase, userId),
    loadDraftedRefs(supabase, userId),
  ])

  const suggestions: ContentSuggestion[] = []
  const seenRefs = new Set<string>()

  function add(s: ContentSuggestion): void {
    if (seenRefs.has(s.seedRef)) return
    seenRefs.add(s.seedRef)
    suggestions.push(s)
  }

  for (const n of nudges) {
    const ref = n.entry_ids?.[0]
    if (!ref) continue
    add({ id: `nudge-${n.id}`, kind: 'nudge', seedType: 'entry', seedRef: ref, seedSummary: n.headline, formats: POST_AND_SUMMARY, insightId: n.id })
  }

  for (const theme of snapshot?.strength_themes ?? []) {
    if (draftedRefs.has(theme)) continue
    add({ id: `theme-${theme}`, kind: 'theme', seedType: 'theme', seedRef: theme, seedSummary: theme, formats: POST_ONLY })
  }

  for (const e of strongEntries) {
    if (draftedRefs.has(e.id)) continue
    add({ id: `entry-${e.id}`, kind: 'entry', seedType: 'entry', seedRef: e.id, seedSummary: e.what_i_did, formats: POST_AND_SUMMARY })
  }

  return suggestions.slice(0, MAX_SUGGESTIONS)
}
