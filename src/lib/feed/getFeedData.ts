import type { createServerClient } from '@/lib/db/supabase/server'
import type { FeedItem, FeedPage, FeedQuery } from './types'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

export const FEED_PAGE_SIZE = 20

interface EvidenceItem {
  type: 'url' | 'image'
  value: string
  label?: string
}

interface RawEntry {
  id: string
  what_i_did: string
  title: string | null
  source: FeedItem['source']
  created_at: string
  entry_date: string | null
  company: string | null
  role_title: string | null
  metric: string | null
  tags: string[]
  evidences: EvidenceItem[]
  impact: string | null
  decision: string | null
  learning: string | null
  file_name: string | null
}

function applyFallbackTitle(entry: RawEntry): string {
  if (entry.title) return entry.title
  return entry.what_i_did.slice(0, 60).trim()
}

function extractThumbnail(evidences: EvidenceItem[]): string | null {
  const imageEvidence = evidences.find((e) => e.type === 'image')
  return imageEvidence?.value ?? null
}

function encodeCursor(dateStr: string, id: string): string {
  return Buffer.from(`${dateStr}|${id}`).toString('base64')
}

// Date-only (YYYY-MM-DD) or ISO timestamp. Used to keep user-controlled date
// values from being interpolated as raw PostgREST filter syntax in `.or()`.
const DATE_LIKE = /^\d{4}-\d{2}-\d{2}(T[\d:.+-]+Z?)?$/
// UUIDs only — hex + dashes; safe to interpolate.
const UUID_LIKE = /^[0-9a-fA-F-]+$/

function isDateLike(value: string): boolean {
  return DATE_LIKE.test(value)
}

function decodeCursor(cursor: string): { date: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
    const [date, id] = decoded.split('|')
    if (!date || !id) return null
    // Reject crafted cursors: date must be the 'null' sentinel or a real date,
    // and id must be a UUID — otherwise they could inject extra filter clauses.
    if (date !== 'null' && !isDateLike(date)) return null
    if (!UUID_LIKE.test(id)) return null
    return { date, id }
  } catch {
    return null
  }
}

// PostgREST treats commas, parens and dots as structural inside `.or()`.
// Wrapping the value in double quotes makes them literal; escape any embedded
// backslash or quote so the term itself can't break out of the quoted value.
function quoteForOr(value: string): string {
  return `"${value.replace(/[\\"]/g, '\\$&')}"`
}

export async function getFeedData(
  supabase: SupabaseServerClient,
  userId: string,
  query: FeedQuery
): Promise<FeedPage> {
  const { axis = 'created_at', cursor, q, from, to, company, tags, metricOnly, source } = query
  const limit = FEED_PAGE_SIZE + 1

  let req = supabase
    .from('entries')
    .select(
      'id, what_i_did, title, source, created_at, entry_date, company, role_title, metric, tags, evidences, impact, decision, learning, file_name'
    )
    .eq('user_id', userId)

  if (cursor) {
    const decoded = decodeCursor(cursor)
    if (decoded) {
      if (axis === 'entry_date') {
        if (decoded.date === 'null') {
          // Past all dated entries — paginate within the null-entry_date group by id
          req = req.is('entry_date', null)
          req = req.lt('id', decoded.id)
        } else {
          // Include null entry_date rows so they flow through to later pages naturally
          req = req.or(
            `entry_date.lt.${decoded.date},and(entry_date.eq.${decoded.date},id.lt.${decoded.id}),entry_date.is.null`
          )
        }
      } else {
        req = req.or(`created_at.lt.${decoded.date},and(created_at.eq.${decoded.date},id.lt.${decoded.id})`)
      }
    }
  }

  if (q) {
    const safeQ = quoteForOr(`%${q}%`)
    req = req.or(`what_i_did.ilike.${safeQ},title.ilike.${safeQ}`)
  }
  if (from && isDateLike(from)) {
    if (axis === 'entry_date') {
      // Include null entry_date rows — they have no date to compare, so they should not disappear
      req = req.or(`entry_date.gte.${from},entry_date.is.null`)
    } else {
      req = req.gte(axis, from)
    }
  }
  if (to && isDateLike(to)) {
    if (axis === 'entry_date') {
      req = req.or(`entry_date.lte.${to},entry_date.is.null`)
    } else {
      // Append end-of-day to date-only strings so the full day is covered for timestamptz columns
      const toISO = to.includes('T') ? to : `${to}T23:59:59.999Z`
      req = req.lte(axis, toISO)
    }
  }
  if (company) {
    req = req.ilike('company', `%${company}%`)
  }
  if (tags && tags.length > 0) {
    req = req.contains('tags', tags)
  }
  if (metricOnly) {
    req = req.not('metric', 'is', null)
  }
  if (source) {
    req = req.eq('source', source)
  }

  if (axis === 'entry_date') {
    req = req.order('entry_date', { ascending: false, nullsFirst: false })
    req = req.order('id', { ascending: false })
  } else {
    req = req.order('created_at', { ascending: false })
    req = req.order('id', { ascending: false })
  }

  req = req.limit(limit)

  const { data } = await req
  const rows = (data ?? []) as RawEntry[]

  const hasNextPage = rows.length > FEED_PAGE_SIZE
  const pageRows = hasNextPage ? rows.slice(0, FEED_PAGE_SIZE) : rows

  const lastRow = pageRows[pageRows.length - 1]
  const nextCursor =
    hasNextPage && lastRow
      ? encodeCursor(
          axis === 'entry_date' ? (lastRow.entry_date ?? 'null') : lastRow.created_at,
          lastRow.id
        )
      : null

  const items: FeedItem[] = pageRows.map((entry) => ({
    id: entry.id,
    title: applyFallbackTitle(entry),
    what_i_did: entry.what_i_did,
    source: entry.source,
    created_at: entry.created_at,
    entry_date: entry.entry_date,
    company: entry.company,
    role_title: entry.role_title,
    metric: entry.metric,
    tags: entry.tags ?? [],
    thumbnail: extractThumbnail(entry.evidences ?? []),
    impact: entry.impact,
    decision: entry.decision,
    learning: entry.learning,
    file_name: entry.file_name,
  }))

  return { items, nextCursor, total: null }
}
