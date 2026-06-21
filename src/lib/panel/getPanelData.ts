import { getTranslations } from 'next-intl/server'
import type { createServerClient } from '@/lib/db/supabase/server'
import type { Entry } from '@/types/entry'
import type { ProactiveInsight } from '@/types/insight'
import type { MacroCategory } from '@/types/mirror'
import { getMirrorStatus, type MirrorStatus } from './getMirrorStatus'
import { getCapturePrompt } from './getCapturePrompt'
import { getReturnSignal, type ReturnSignal, type ReturnSignalEntry } from './getReturnSignal'
import { getReviewCycleSignal, type ReviewCycleSignal } from './getReviewCycleSignal'

const MS_PER_DAY = 86_400_000
const MS_PER_MONTH = MS_PER_DAY * 30

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

interface RecentEntryRow {
  id: string
  what_i_did: string
  title: string | null
  source: Entry['source']
  entry_date: string | null
  created_at: string
}

export interface TimelineEntry {
  id: string
  role_title: string | null
  company: string | null
  entry_date: string | null
}

interface MirrorRow {
  primary_strength: { headline: string } | null
  strength_themes: string[] | null
  generated_at: string
  mirror: unknown
}

export interface SkillSummary {
  comprovadas: number
  consistentes: number
  emergentes: number
  total: number
}

/** Conquistas com impacto preenchido — alimentam o TrajectoryHighlights (redesign 017 do Painel). */
export interface HighlightEntry {
  id: string
  what_i_did: string
  impact: string | null
  metric: string | null
  entry_date: string | null
}

export interface PanelMirror {
  headline: string | null
  strengthThemes: string[]
  skillSummary: SkillSummary | null
}

export interface PanelData {
  name: string
  avatarUrl: string | null
  status: MirrorStatus
  entryCount: number
  monthsSpan: number | null
  daysSince: number | null
  recentEntries: RecentEntryRow[]
  timelineEntries: TimelineEntry[]
  highlights: HighlightEntry[]
  mirror: PanelMirror | null
  insight: ProactiveInsight | null
  composerPlaceholder: string
  returnSignal: ReturnSignal
  reviewCycleSignal: ReviewCycleSignal
}

export type { ReturnSignal, ReviewCycleSignal }

/** Dias desde a última entrada que ainda contam como "tem material recente para escrever". */
const RECENT_ENTRY_DAYS = 60

function calculateMonthsSpan(oldestDate: string | null, newestDate: string | null): number | null {
  if (!oldestDate || !newestDate) return null

  const span = new Date(newestDate).getTime() - new Date(oldestDate).getTime()
  if (span < MS_PER_MONTH) return null

  return Math.max(1, Math.round(span / MS_PER_MONTH))
}

function calculateDaysSince(createdAt: string | undefined): number | null {
  if (!createdAt) return null
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / MS_PER_DAY)
}

export async function getPanelData(supabase: SupabaseServerClient, userId: string): Promise<PanelData> {
  const [
    profileRes,
    countRes,
    recentRes,
    oldestRes,
    newestRes,
    mirrorRes,
    insightRes,
    timelineRes,
    highlightsRes,
    oldestByCreatedRes,
  ] = await Promise.all([
    supabase.from('profiles').select('name, avatar_url, last_panel_seen_at, review_cycle_months, review_cycle_anchor').eq('id', userId).single(),
    supabase.from('entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('entries')
      .select('id, what_i_did, title, source, entry_date, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('entries')
      .select('entry_date')
      .eq('user_id', userId)
      .not('entry_date', 'is', null)
      .order('entry_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('entries')
      .select('entry_date')
      .eq('user_id', userId)
      .not('entry_date', 'is', null)
      .order('entry_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('mirror_snapshots')
      .select('primary_strength, strength_themes, generated_at, mirror')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('proactive_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('seen', false)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('entries')
      .select('id, role_title, company, entry_date')
      .eq('user_id', userId)
      .not('role_title', 'is', null)
      .order('entry_date', { ascending: false })
      .limit(10),
    supabase
      .from('entries')
      .select('id, what_i_did, impact, metric, entry_date')
      .eq('user_id', userId)
      .not('impact', 'is', null)
      .order('entry_date', { ascending: false })
      .limit(3),
    // Entrada mais antiga por created_at — alimenta o ramo "old-victory" do sinal
    // de retorno. A mais nova já vem em `recentRes`, então não precisamos varrer
    // as 50 últimas entradas só para computar o sinal.
    supabase
      .from('entries')
      .select('id, what_i_did, entry_date, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const recentEntries = (recentRes.data ?? []) as RecentEntryRow[]
  const entryCount = countRes.count ?? 0
  const mirrorRow = mirrorRes.data as MirrorRow | null
  const profileData = profileRes.data as {
    name?: string | null
    avatar_url?: string | null
    last_panel_seen_at?: string | null
    review_cycle_months?: number | null
    review_cycle_anchor?: string | null
  } | null
  const lastPanelSeenAt = profileData?.last_panel_seen_at ?? null
  const lastEntry = recentEntries[0]
  const daysSince = calculateDaysSince(lastEntry?.created_at)
  const oldestEntryDate = (oldestRes.data as { entry_date: string } | null)?.entry_date ?? null
  const newestEntryDate = (newestRes.data as { entry_date: string } | null)?.entry_date ?? null

  const categories: MacroCategory[] =
    (mirrorRow?.mirror as { categories?: MacroCategory[] } | null)?.categories ?? []
  const allSkills = categories.flatMap((c) => c.skills)
  const skillSummary: SkillSummary | null =
    allSkills.length > 0
      ? {
          comprovadas: allSkills.filter((s) => s.tier === 'Comprovada').length,
          consistentes: allSkills.filter((s) => s.tier === 'Consistente').length,
          emergentes: allSkills.filter((s) => s.tier === 'Emergente').length,
          total: allSkills.length,
        }
      : null

  const mirror: PanelMirror | null = mirrorRow
    ? {
        headline: mirrorRow.primary_strength?.headline ?? null,
        strengthThemes: mirrorRow.strength_themes ?? [],
        skillSummary,
      }
    : null

  // O sinal de retorno só precisa da entrada mais nova (detecta "has-new" e é a que
  // ele exibe) e da mais antiga (ramo "old-victory"). A mais nova já está em
  // `recentEntries[0]`; a mais antiga vem de `oldestByCreatedRes`. Deduplicamos por
  // id para a base com uma única entrada.
  const oldestByCreated = (oldestByCreatedRes.data as ReturnSignalEntry | null) ?? null
  const returnSignalCandidates = [recentEntries[0] ?? null, oldestByCreated].filter(
    (e): e is ReturnSignalEntry => e !== null
  )
  const returnSignalEntries =
    entryCount === 0
      ? []
      : returnSignalCandidates.filter(
          (e, i) => returnSignalCandidates.findIndex((x) => x.id === e.id) === i
        )
  const returnSignal = getReturnSignal({
    entries: returnSignalEntries,
    lastPanelSeenAt,
    latestMirrorGeneratedAt: mirrorRow?.generated_at ?? null,
    lastMirrorSeenAt: lastPanelSeenAt,
  })

  const reviewCycleSignal = getReviewCycleSignal({
    reviewCycleMonths: profileData?.review_cycle_months ?? null,
    reviewCycleAnchor: profileData?.review_cycle_anchor ?? null,
    now: new Date(),
    hasRecentEntries: daysSince !== null && daysSince <= RECENT_ENTRY_DAYS,
  })

  // Fire-and-forget: update last_panel_seen_at for next visit delta computation.
  void supabase
    .from('profiles')
    .update({ last_panel_seen_at: new Date().toISOString() })
    .eq('id', userId)

  const t = await getTranslations('capture.composer.prompt')
  const prompt = getCapturePrompt(daysSince, mirror?.strengthThemes)

  const seenCompanies = new Set<string>()
  const timelineEntries = ((timelineRes.data ?? []) as TimelineEntry[]).filter((e) => {
    if (!e.company) return true
    if (seenCompanies.has(e.company)) return false
    seenCompanies.add(e.company)
    return true
  })

  return {
    name: profileData?.name ?? '',
    avatarUrl: profileData?.avatar_url ?? null,
    status: getMirrorStatus(entryCount),
    entryCount,
    monthsSpan: calculateMonthsSpan(oldestEntryDate, newestEntryDate),
    daysSince,
    recentEntries,
    timelineEntries,
    highlights: (highlightsRes.data ?? []) as HighlightEntry[],
    mirror,
    insight: (insightRes.data as ProactiveInsight | null) ?? null,
    composerPlaceholder: t(prompt.key, prompt.values),
    returnSignal,
    reviewCycleSignal,
  }
}
