import type { createServerClient } from '@/lib/db/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

export interface HistoricoPosition {
  role_title: string
  company: string
  company_initials: string
  company_tint: { bg: string; fg: string }
  role_start: string | null
  role_end: string | null
  period_label: string
  year_label: string
  entries: {
    what_i_did: string
    impact: string | null
    metric: string | null
  }[]
}

export interface HistoricoData {
  positions: HistoricoPosition[]
}

const COMPANY_TINTS = [
  { bg: 'oklch(30% 0.20 320)', fg: 'oklch(98% 0.008 90)' },
  { bg: 'oklch(45% 0.10 190)', fg: 'oklch(98% 0.008 90)' },
  { bg: 'oklch(62% 0.22 28)',  fg: 'oklch(98% 0.008 90)' },
  { bg: 'oklch(50% 0.11 75)',  fg: 'oklch(98% 0.008 90)' },
  { bg: 'oklch(55% 0.15 265)', fg: 'oklch(98% 0.008 90)' },
]

export function getCompanyTint(name: string): { bg: string; fg: string } {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COMPANY_TINTS[hash % COMPANY_TINTS.length]
}

export function getCompanyInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function formatPeriodLabel(start: string | null, end: string | null): string {
  if (!start) return '?'

  const startDate = new Date(start)
  const startYear = startDate.getFullYear()
  if (isNaN(startYear)) return '?'

  if (!end) {
    const startMonth = startDate.toLocaleString('pt-BR', { month: 'short' })
    return `${startMonth} ${startYear}–atual`
  }

  const endDate = new Date(end)
  const endYear = endDate.getFullYear()
  if (isNaN(endYear)) return String(startYear)

  if (startYear === endYear) return String(startYear)
  return `${startYear}–${endYear}`
}

function formatYearLabel(start: string | null, end: string | null): string {
  if (!start) return '?'

  const startYear = new Date(start).getFullYear()
  if (isNaN(startYear)) return '?'

  if (!end) return `${startYear}–hoje`

  const endYear = new Date(end).getFullYear()
  if (isNaN(endYear)) return String(startYear)

  if (startYear === endYear) return String(startYear)
  return `${startYear}–${endYear}`
}

interface RawEntry {
  role_title: string | null
  company: string | null
  role_start: string | null
  role_end: string | null
  what_i_did: string
  impact: string | null
  metric: string | null
}

export function groupPositions(entries: RawEntry[]): HistoricoPosition[] {
  const map = new Map<string, HistoricoPosition>()

  for (const entry of entries) {
    if (!entry.role_title || !entry.company) continue

    const key = `${entry.role_title}|||${entry.company}`

    const existing = map.get(key)
    if (existing) {
      if (existing.entries.length < 5) {
        existing.entries.push({
          what_i_did: entry.what_i_did,
          impact: entry.impact,
          metric: entry.metric,
        })
      }
    } else {
      const tint = getCompanyTint(entry.company)
      const initials = getCompanyInitials(entry.company)
      map.set(key, {
        role_title: entry.role_title,
        company: entry.company,
        company_initials: initials,
        company_tint: tint,
        role_start: entry.role_start,
        role_end: entry.role_end,
        period_label: formatPeriodLabel(entry.role_start, entry.role_end),
        year_label: formatYearLabel(entry.role_start, entry.role_end),
        entries: [
          {
            what_i_did: entry.what_i_did,
            impact: entry.impact,
            metric: entry.metric,
          },
        ],
      })
    }
  }

  return Array.from(map.values())
}

export async function getHistoricoData(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<HistoricoData> {
  const { data } = await supabase
    .from('entries')
    .select('role_title, company, role_start, role_end, what_i_did, impact, metric')
    .eq('user_id', userId)
    .not('role_title', 'is', null)
    .not('company', 'is', null)
    .order('role_start', { ascending: false, nullsFirst: false })

  const positions = groupPositions((data ?? []) as RawEntry[])

  return { positions }
}
