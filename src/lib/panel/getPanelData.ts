import type { createServerClient } from '@/lib/db/supabase/server'
import type { Entry } from '@/types/entry'
import type { ProactiveInsight } from '@/types/insight'
import { getMirrorStatus, type MirrorStatus } from './getMirrorStatus'
import { getCapturePrompt } from './getCapturePrompt'

const MS_PER_DAY = 86_400_000
const MS_PER_MONTH = MS_PER_DAY * 30
const MIN_DATED_ENTRIES_FOR_SPAN = 2

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

interface RecentEntryRow {
  id: string
  what_i_did: string
  source: Entry['source']
  entry_date: string | null
  created_at: string
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
  mirror: PanelMirror | null
  insight: ProactiveInsight | null
  composerPlaceholder: string
}

function calculateMonthsSpan(entries: RecentEntryRow[]): number | null {
  const dates = entries
    .map((entry) => entry.entry_date)
    .filter((date): date is string => Boolean(date))
    .map((date) => new Date(date).getTime())

  if (dates.length < MIN_DATED_ENTRIES_FOR_SPAN) return null

  const span = Math.max(...dates) - Math.min(...dates)
  return Math.max(1, Math.round(span / MS_PER_MONTH))
}

function calculateDaysSince(createdAt: string | undefined): number | null {
  if (!createdAt) return null
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / MS_PER_DAY)
}

export async function getPanelData(supabase: SupabaseServerClient, userId: string): Promise<PanelData> {
  const [profileRes, countRes, recentRes, mirrorRes, insightRes] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', userId).single(),
    supabase.from('entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('entries')
      .select('id, what_i_did, source, entry_date, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
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
  ])

  const recentEntries = (recentRes.data ?? []) as RecentEntryRow[]
  const entryCount = countRes.count ?? 0
  const mirrorRow = mirrorRes.data as MirrorRow | null
  const lastEntry = recentEntries[0]
  const daysSince = calculateDaysSince(lastEntry?.created_at)

  const mirror: PanelMirror | null = mirrorRow
    ? {
        headline: mirrorRow.primary_strength?.headline ?? null,
        strengthThemes: mirrorRow.strength_themes ?? [],
      }
    : null

  return {
    name: profileRes.data?.name ?? '',
    status: getMirrorStatus(entryCount),
    entryCount,
    monthsSpan: calculateMonthsSpan(recentEntries),
    daysSince,
    recentEntries,
    mirror,
    insight: (insightRes.data as ProactiveInsight | null) ?? null,
    composerPlaceholder: getCapturePrompt(daysSince, mirror?.strengthThemes),
  }
}
