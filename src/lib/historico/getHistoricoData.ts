import type { createServerClient } from '@/lib/db/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

export interface EvidenceItem {
  type: 'url' | 'image'
  value: string
  label?: string
}

export interface HistoricoEntry {
  id: string
  display_key?: string
  what_i_did: string
  impact: string | null
  metric: string | null
  evidences: EvidenceItem[]
}

export interface HistoricoProject {
  name: string
  entries: HistoricoEntry[]
}

export interface RolePeriod {
  role_title: string
  period_label: string
  year_label: string
}

export interface HistoricoCompany {
  company: string
  company_initials: string
  company_tint: { bg: string; fg: string }
  year_label: string
  roles: RolePeriod[]
  projects: HistoricoProject[]
  highlight_bullets: string[]
}

export interface HistoricoData {
  companies: HistoricoCompany[]
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

function safeYear(dateStr: string | null): number | null {
  if (!dateStr) return null
  const y = new Date(dateStr + 'T12:00:00').getFullYear()
  return isNaN(y) ? null : y
}

function formatPeriodLabel(start: string | null, end: string | null): string {
  if (!start) return '?'
  const startDate = new Date(start + 'T12:00:00')
  const startYear = startDate.getFullYear()
  if (isNaN(startYear)) return '?'
  if (!end) {
    const startMonth = startDate.toLocaleString('pt-BR', { month: 'short' })
    return `${startMonth} ${startYear}–atual`
  }
  const endYear = new Date(end + 'T12:00:00').getFullYear()
  if (isNaN(endYear)) return String(startYear)
  if (startYear === endYear) return String(startYear)
  return `${startYear}–${endYear}`
}

function formatYearLabel(start: string | null, end: string | null): string {
  if (!start) return '?'
  const startYear = safeYear(start)
  if (startYear === null) return '?'
  if (!end) return `${startYear}–hoje`
  const endYear = safeYear(end)
  if (endYear === null) return String(startYear)
  if (startYear === endYear) return String(startYear)
  return `${startYear}–${endYear}`
}

export interface RawEntry {
  id: string
  role_title: string | null
  company: string | null
  role_start: string | null
  role_end: string | null
  what_i_did: string
  impact: string | null
  metric: string | null
  project_name: string | null
  evidences: EvidenceItem[]
  is_personal_project?: boolean
  entry_highlights?: Array<{
    title: string | null
    metric: string | null
    impact: string | null
  }>
}

const MAX_HIGHLIGHT_BULLETS = 3
const NON_CAREER_CONTEXTS = new Set(['entrevista', 'entrevistas'])

// Accumulates per-role data so we can merge duplicates captured from different documents.
// Key: role_title + start-year + end-year (or "current") — same title/year-range = same role.
interface RoleAcc {
  role_title: string
  minStart: string | null
  maxEnd: string | null
  hasCurrentEnd: boolean
}

interface ProjectAcc {
  entries: HistoricoEntry[]
  seenKeys: Set<string>
}

interface CompanyAccumulator {
  roleAccMap: Map<string, RoleAcc>
  projectMap: Map<string, ProjectAcc>
  standaloneEntries: RawEntry[]
  standaloneSeenKeys: Set<string>
  minStart: string | null
  maxEnd: string | null
  hasCurrentRole: boolean
}

function dedupKey(text: string): string {
  return text.trim().slice(0, 120)
}

/** A fonte continua sendo a unidade de contexto, mas seus destaques são as unidades de narrativa. */
function displayEntries(entry: RawEntry): HistoricoEntry[] {
  const highlights = entry.entry_highlights?.filter((highlight) => highlight.title) ?? []
  if (highlights.length === 0) {
    return [{
      id: entry.id,
      what_i_did: entry.what_i_did,
      impact: entry.impact,
      metric: entry.metric,
      evidences: entry.evidences,
    }]
  }

  return highlights.map((highlight, index) => ({
    // A ação de evidência/correção opera sobre a fonte real, não sobre uma linha sintética.
    id: entry.id,
    display_key: `${entry.id}:${index}`,
    what_i_did: highlight.title!,
    impact: highlight.impact,
    metric: highlight.metric,
    evidences: entry.evidences,
  }))
}

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function findFuzzyKey(map: Map<string, CompanyAccumulator>, name: string): string | undefined {
  const normalized = name.trim().toLowerCase()
  for (const key of map.keys()) {
    if (levenshtein(key.trim().toLowerCase(), normalized) <= 2) return key
  }
  return undefined
}

export function groupCompanies(entries: RawEntry[]): HistoricoCompany[] {
  const map = new Map<string, CompanyAccumulator>()

  for (const entry of entries) {
    const companyName = entry.company ?? (entry.is_personal_project ? 'Projetos pessoais' : null)
    if (!companyName) continue
    // Transcrições antigas podiam receber "Entrevistas" como empresa por engano. Elas continuam
    // disponíveis em Registros, mas não devem virar uma empresa ou despejar texto cru na Trajetória.
    if (NON_CAREER_CONTEXTS.has(companyName.trim().toLowerCase())) continue

    const canonicalKey = findFuzzyKey(map, companyName) ?? companyName

    if (!map.has(canonicalKey)) {
      map.set(canonicalKey, {
        roleAccMap: new Map(),
        projectMap: new Map(),
        standaloneEntries: [],
        standaloneSeenKeys: new Set(),
        minStart: null,
        maxEnd: null,
        hasCurrentRole: false,
      })
    }

    const acc = map.get(canonicalKey)!

    // Role deduplication: key by title + start-year + end-year.
    // Entries from the same role captured on different dates get merged instead of
    // creating duplicate "PM 2024–hoje · PM 2024–hoje · PM 2024–hoje" lines.
    if (entry.role_title) {
      const startYear = safeYear(entry.role_start)
      const endYear = entry.role_end ? (safeYear(entry.role_end) ?? 'unknown') : 'current'
      const roleKey = `${entry.role_title}|||${startYear ?? '?'}|||${endYear}`

      if (!acc.roleAccMap.has(roleKey)) {
        acc.roleAccMap.set(roleKey, {
          role_title: entry.role_title,
          minStart: entry.role_start,
          maxEnd: entry.role_end,
          hasCurrentEnd: !entry.role_end,
        })
      } else {
        const ra = acc.roleAccMap.get(roleKey)!
        if (entry.role_start && (!ra.minStart || entry.role_start < ra.minStart)) {
          ra.minStart = entry.role_start
        }
        if (!entry.role_end) {
          ra.hasCurrentEnd = true
        } else if (!ra.hasCurrentEnd && (!ra.maxEnd || entry.role_end > ra.maxEnd)) {
          ra.maxEnd = entry.role_end
        }
      }
    }

    // Track company date span
    if (entry.role_start && (!acc.minStart || entry.role_start < acc.minStart)) {
      acc.minStart = entry.role_start
    }
    if (!entry.role_end) {
      acc.hasCurrentRole = true
    } else if (!acc.hasCurrentRole && (!acc.maxEnd || entry.role_end > acc.maxEnd)) {
      acc.maxEnd = entry.role_end
    }

    // Projects are a legacy storage field. New trajectory treats every source as career evidence
    // under the company, so old project-tagged entries are flattened into the same stream.
    const entriesForDisplay = displayEntries(entry)

    const key = entriesForDisplay.map((displayEntry) => dedupKey(displayEntry.what_i_did)).join('|')
    if (!acc.standaloneSeenKeys.has(key)) {
      acc.standaloneSeenKeys.add(key)
      acc.standaloneEntries.push(entry)
    }
  }

  const result: HistoricoCompany[] = []

  for (const [company, acc] of map) {
    const effectiveEnd = acc.hasCurrentRole ? null : acc.maxEnd

    const roles: RolePeriod[] = Array.from(acc.roleAccMap.values()).map((ra) => {
      const end = ra.hasCurrentEnd ? null : ra.maxEnd
      return {
        role_title: ra.role_title,
        period_label: formatPeriodLabel(ra.minStart, end),
        year_label: formatYearLabel(ra.minStart, end),
      }
    })

    const standaloneDisplayEntries = acc.standaloneEntries.flatMap(displayEntries)
    const sorted = [
      ...standaloneDisplayEntries.filter((entry) => entry.metric),
      ...standaloneDisplayEntries.filter((entry) => !entry.metric),
    ]
    const highlight_bullets = sorted.slice(0, MAX_HIGHLIGHT_BULLETS).map((entry) => entry.what_i_did)

    // Kept as an empty compatibility shape for clients compiled against the old API. The UI no
    // longer exposes a project hierarchy; legacy project_name values remain in storage only.
    const projects: HistoricoProject[] = []

    result.push({
      company,
      company_initials: getCompanyInitials(company),
      company_tint: getCompanyTint(company),
      year_label: formatYearLabel(acc.minStart, effectiveEnd),
      roles,
      projects,
      highlight_bullets,
    })
  }

  return result
}

export async function getHistoricoData(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<HistoricoData> {
  const { data } = await supabase
    .from('entries')
    .select('id, role_title, company, role_start, role_end, what_i_did, impact, metric, project_name, evidences, is_personal_project, entry_highlights(title, metric, impact)')
    .eq('user_id', userId)
    .or('company.not.is.null,is_personal_project.eq.true')
    .order('role_start', { ascending: false, nullsFirst: false })

  const companies = groupCompanies((data ?? []) as RawEntry[])

  return { companies }
}
