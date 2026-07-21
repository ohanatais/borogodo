import type { createServerClient } from '@/lib/db/supabase/server'
import { deriveContextStatus } from '@/lib/entries/contextStatus'
import { deriveOrganizationStatus } from '@/lib/entries/organizationStatus'
import type { FeedHighlight, FeedItem, FeedPage, FeedQuery } from './types'

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
  is_personal_project: boolean
  role_title: string | null
  metric: string | null
  tags: string[]
  evidences: EvidenceItem[]
  impact: string | null
  decision: string | null
  learning: string | null
  file_name: string | null
  organized_at: string | null
  organizing_started_at: string | null
}

interface HighlightRow {
  id: string
  entry_id: string
  title: string | null
  metric: string | null
  impact: string | null
  tags: string[] | null
}

/**
 * US7 (FR-025/FR-026): agrupa as linhas de `entry_highlights` por fonte — uma única query por
 * página em vez de N (uma por card), o que elimina o fetch lazy que cada card fazia sob demanda.
 */
function groupHighlightsByEntry(rows: HighlightRow[]): Map<string, FeedHighlight[]> {
  const map = new Map<string, FeedHighlight[]>()
  for (const row of rows) {
    const list = map.get(row.entry_id) ?? []
    list.push({ id: row.id, title: row.title, metric: row.metric, impact: row.impact, tags: row.tags ?? [] })
    map.set(row.entry_id, list)
  }
  return map
}

/**
 * FR-032: uma fonte sem nenhuma linha em `entry_highlights` (registro antigo, ou ainda não
 * organizado) é tratada como fonte de destaque único — sintetizado a partir dos campos legados
 * da própria entry, nunca um array vazio (todo card do feed tem ao menos 1 destaque a mostrar).
 */
function syntheticHighlight(entry: RawEntry, title: string): FeedHighlight {
  return {
    id: entry.id,
    title,
    metric: entry.metric,
    impact: entry.impact,
    tags: entry.tags ?? [],
  }
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
  const { axis = 'created_at', cursor, q, from, to, company, tags, metricOnly, source, entryId } = query
  const limit = FEED_PAGE_SIZE + 1

  let req = supabase
    .from('entries')
    .select(
      'id, what_i_did, title, source, created_at, entry_date, company, is_personal_project, role_title, metric, tags, evidences, impact, decision, learning, file_name, organized_at, organizing_started_at'
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
  let rows = (data ?? []) as RawEntry[]

  // Evidence links can point to older records outside the first page. Fetch that one owned
  // record explicitly so the deep link opens a real card instead of silently landing on page 1.
  if (entryId && !rows.some((entry) => entry.id === entryId)) {
    const { data: target } = await supabase
      .from('entries')
      .select('id, what_i_did, title, source, created_at, entry_date, company, is_personal_project, role_title, metric, tags, evidences, impact, decision, learning, file_name, organized_at, organizing_started_at')
      .eq('id', entryId)
      .eq('user_id', userId)
      .maybeSingle()
    if (target) rows = [target as RawEntry, ...rows]
  }

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

  // US7 (FR-025/FR-026): uma única query batched contra `entry_highlights` para toda a página,
  // em vez de um fetch por card — elimina o round-trip lazy que o `SourceCard` fazia ao expandir.
  let highlightRows: HighlightRow[] = []
  if (pageRows.length > 0) {
    const { data: highlightData } = await supabase
      .from('entry_highlights')
      .select('id, entry_id, title, metric, impact, tags')
      .in(
        'entry_id',
        pageRows.map((entry) => entry.id)
      )
      .eq('user_id', userId)
      .order('position', { ascending: true })
    highlightRows = (highlightData ?? []) as HighlightRow[]
  }
  const highlightsByEntry = groupHighlightsByEntry(highlightRows)

  const items: FeedItem[] = pageRows.map((entry) => {
    const fallbackTitle = applyFallbackTitle(entry)
    const highlights = highlightsByEntry.get(entry.id) ?? [syntheticHighlight(entry, fallbackTitle)]
    // Com exatamente 1 destaque, o cabeçalho do card mostra o título/métrica DELE (outcome-first,
    // gerado pelo "Organizar" — FR-019) em vez do `entries.title`/`entries.metric` legados: esses
    // campos legados nunca são atualizados pela organização (só `entry_highlights` recebe o
    // título outcome-first), então o cabeçalho ficava preso na heurística "início do texto cru"
    // mesmo depois de organizado. Com 2+ destaques, nenhum título/métrica isolado representa a
    // fonte inteira — mantém o fallback.
    const singleHighlight = highlights.length === 1 ? highlights[0] : null
    return {
      id: entry.id,
      title: (singleHighlight?.title || fallbackTitle),
      what_i_did: entry.what_i_did,
      source: entry.source,
      created_at: entry.created_at,
      entry_date: entry.entry_date,
      company: entry.company,
      is_personal_project: entry.is_personal_project ?? false,
      role_title: entry.role_title,
      metric: singleHighlight ? singleHighlight.metric : null,
      tags: entry.tags ?? [],
      thumbnail: extractThumbnail(entry.evidences ?? []),
      evidences: entry.evidences ?? [],
      impact: singleHighlight ? singleHighlight.impact : entry.impact,
      decision: entry.decision,
      learning: entry.learning,
      file_name: entry.file_name,
      organized_at: entry.organized_at ?? null,
      organizing_started_at: entry.organizing_started_at ?? null,
      highlights,
      organizationStatus: deriveOrganizationStatus(entry.organized_at ?? null, entry.organizing_started_at ?? null),
      contextStatus: deriveContextStatus(entry.company ?? null, entry.is_personal_project ?? false),
    }
  })

  return { items, nextCursor, total: null }
}
