import { describe, it, expect, vi } from 'vitest'
import { getPanelData } from '@/lib/panel/getPanelData'

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string, values?: Record<string, unknown>) => {
    if (values) return `${key}:${JSON.stringify(values)}`
    return key
  }),
}))

interface TableFixture {
  count?: number
  single?: { data: unknown; error: unknown }
  maybeSingle?: { data: unknown; error: unknown }
  maybySingleSeq?: Array<{ data: unknown; error: unknown }>
  list?: { data: unknown[]; error: unknown }
}

function chain(fixture: TableFixture) {
  const result = {
    select: () => result,
    eq: () => result,
    not: () => result,
    order: () => result,
    limit: () => result,
    single: async () => fixture.single ?? { data: null, error: null },
    maybeSingle: async () => {
      if (fixture.maybySingleSeq?.length) {
        return fixture.maybySingleSeq.shift() ?? { data: null, error: null }
      }
      return fixture.maybeSingle ?? { data: null, error: null }
    },
    then: (resolve: (value: { data: unknown[] | null; count?: number; error: unknown }) => unknown) =>
      resolve({ data: fixture.list?.data ?? null, count: fixture.count, error: null }),
  }
  return result
}

function buildSupabase(fixtures: Record<string, TableFixture>) {
  return {
    from: (table: string) => chain(fixtures[table] ?? {}),
  } as unknown as Parameters<typeof getPanelData>[0]
}

const RECENT_ENTRIES = [
  { id: 'e3', what_i_did: 'Entrega C', source: 'text', entry_date: '2026-06-05', created_at: '2026-06-05T10:00:00Z' },
  { id: 'e2', what_i_did: 'Entrega B', source: 'text', entry_date: '2026-04-01', created_at: '2026-04-01T10:00:00Z' },
  { id: 'e1', what_i_did: 'Entrega A', source: 'linkedin_pdf', entry_date: '2026-02-01', created_at: '2026-02-01T10:00:00Z' },
]

describe('getPanelData', () => {
  it('derives status, indicators and composer placeholder from the four reads', async () => {
    const supabase = buildSupabase({
      profiles: { single: { data: { name: 'Ana Silva' }, error: null } },
      entries: {
        count: 12,
        list: { data: RECENT_ENTRIES, error: null },
        maybySingleSeq: [
          { data: { entry_date: '2020-01-15' }, error: null },
          { data: { entry_date: '2026-06-05' }, error: null },
        ],
      },
      mirror_snapshots: {
        maybeSingle: {
          data: { primary_strength: { headline: 'Você lidera pelo exemplo.' }, strength_themes: ['liderança'], generated_at: '2026-06-01' },
          error: null,
        },
      },
      proactive_insights: { maybeSingle: { data: null, error: null } },
    })

    const data = await getPanelData(supabase, 'user-1')

    expect(data.name).toBe('Ana Silva')
    expect(data.status).toBe('active')
    expect(data.entryCount).toBe(12)
    expect(data.monthsSpan).toBeGreaterThan(0)
    expect(data.mirror).toEqual({ headline: 'Você lidera pelo exemplo.', strengthThemes: ['liderança'] })
    expect(data.recentEntries).toHaveLength(3)
    expect(data.insight).toBeNull()
    expect(typeof data.composerPlaceholder).toBe('string')
  })

  it('returns null mirror and "building" status with no entries', async () => {
    const supabase = buildSupabase({
      profiles: { single: { data: { name: 'Ana Silva' }, error: null } },
      entries: { count: 0, list: { data: [], error: null }, maybySingleSeq: [{ data: null, error: null }, { data: null, error: null }] },
      mirror_snapshots: { maybeSingle: { data: null, error: null } },
      proactive_insights: { maybeSingle: { data: null, error: null } },
    })

    const data = await getPanelData(supabase, 'user-1')

    expect(data.status).toBe('building')
    expect(data.mirror).toBeNull()
    expect(data.monthsSpan).toBeNull()
    expect(data.daysSince).toBeNull()
  })
})
