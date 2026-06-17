import type { createServerClient } from '@/lib/db/supabase/server'
import type { ActivityCell } from './types'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

export async function getActivityData(
  supabase: SupabaseServerClient,
  userId: string,
  windowDays: number
): Promise<ActivityCell[]> {
  const since = new Date()
  since.setDate(since.getDate() - windowDays)
  const sinceISO = since.toISOString()

  const { data } = await supabase
    .from('entries')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', sinceISO)
    .order('created_at', { ascending: true })

  if (!data || data.length === 0) return []

  const counts = new Map<string, number>()
  for (const row of data as { created_at: string }[]) {
    const date = row.created_at.split('T')[0]
    counts.set(date, (counts.get(date) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
