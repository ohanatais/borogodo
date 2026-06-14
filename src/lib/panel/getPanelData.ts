import { getTranslations } from 'next-intl/server'
import type { createServerClient } from '@/lib/db/supabase/server'
import type { Entry } from '@/types/entry'
import type { ProactiveInsight } from '@/types/insight'
import { getMirrorStatus, type MirrorStatus } from './getMirrorStatus'
import { getCapturePrompt } from './getCapturePrompt'

const MS_PER_DAY = 86_400_000
const MS_PER_MONTH = MS_PER_DAY * 30

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

interface RecentEntryRow {
  id: string
  what_i_did: string
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

export interface HighlightEntry {
  id: string
  what_i_did: string
  impact: string | null
  metric: string | null
  entry_date: string | null
}

interface MirrorRow {
  primary_strength: { headline: string } | null
  strength_themes: string[] | null
  generated_at: string
}

export interface PanelMirror {
  headline: string | null
  strengthThemes: string[]
}

export interface PanelData {
  name: string
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
}

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
  ] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', userId).single(),
    supabase.from('entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('entries')
      .select('id, what_i_did, source, entry_date, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
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
      .select('primary_strength, strength_themes, generated_at')
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
      .limit(3),
    supabase
      .from('entries')
      .select('id, what_i_did, impact, metric, entry_date')
      .eq('user_id', userId)
      .not('impact', 'is', null)
      .order('entry_date', { ascending: false })
      .limit(3),
  ])

  const recentEntries = (recentRes.data ?? []) as RecentEntryRow[]
  const entryCount = countRes.count ?? 0
  const mirrorRow = mirrorRes.data as MirrorRow | null
  const lastEntry = recentEntries[0]
  const daysSince = calculateDaysSince(lastEntry?.created_at)
  const oldestEntryDate = (oldestRes.data as { entry_date: string } | null)?.entry_date ?? null
  const newestEntryDate = (newestRes.data as { entry_date: string } | null)?.entry_date ?? null

  const mirror: PanelMirror | null = mirrorRow
    ? {
        headline: mirrorRow.primary_strength?.headline ?? null,
        strengthThemes: mirrorRow.strength_themes ?? [],
      }
    : null

  const t = await getTranslations('capture.composer.prompt')
  const prompt = getCapturePrompt(daysSince, mirror?.strengthThemes)

  return {
    name: profileRes.data?.name ?? '',
    status: getMirrorStatus(entryCount),
    entryCount,
    monthsSpan: calculateMonthsSpan(oldestEntryDate, newestEntryDate),
    daysSince,
    recentEntries,
    timelineEntries: (timelineRes.data ?? []) as TimelineEntry[],
    highlights: (highlightsRes.data ?? []) as HighlightEntry[],
    mirror,
    insight: (insightRes.data as ProactiveInsight | null) ?? null,
    composerPlaceholder: t(prompt.key, prompt.values),
  }
}
