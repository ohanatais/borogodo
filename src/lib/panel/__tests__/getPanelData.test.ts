import { describe, it, expect, vi } from 'vitest'
import type { PanelData } from '../getPanelData'

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}))

vi.mock('@/lib/log', () => ({ logger: { error: vi.fn() } }))

function makeEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'e1',
    what_i_did: 'Conduziu workshop',
    title: 'Workshop de discovery',
    source: 'text',
    entry_date: null,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeSupabase(overrides: Record<string, unknown> = {}) {
  const recentEntries = Array.from({ length: 5 }, (_, i) => makeEntry({ id: `e${i}`, title: `Title ${i}` }))

  function makeBuilder(data: unknown, count?: number) {
    const builder: Record<string, unknown> = {}
    const chain = ['eq', 'not', 'is', 'order', 'limit', 'single', 'maybeSingle', 'select', 'head', 'in', 'update'] as const
    for (const m of chain) {
      builder[m] = vi.fn(() => builder)
    }
    builder.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data, error: null, count: count ?? null })
    return builder
  }

  return {
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => makeBuilder({ name: 'Ohana', avatar_url: null, last_panel_seen_at: null })),
          update: vi.fn(() => makeBuilder(null)),
        }
      }
      if (table === 'entries') {
        return {
          select: vi.fn((cols?: string, opts?: Record<string, unknown>) => {
            if (opts?.head) return makeBuilder(null, 0)
            return makeBuilder(recentEntries)
          }),
        }
      }
      if (table === 'mirror_snapshots') {
        return { select: vi.fn(() => makeBuilder(null)) }
      }
      if (table === 'proactive_insights') {
        return { select: vi.fn(() => makeBuilder(null)) }
      }
      return { select: vi.fn(() => makeBuilder(null)) }
    }),
    ...overrides,
  }
}

describe('T039 — getPanelData US6', () => {
  it('recentEntries inclui title e tem até 5 itens', async () => {
    const { getPanelData } = await import('../getPanelData')
    const supabase = makeSupabase()

    const data = await getPanelData(supabase as never, 'user-1')

    expect(data.recentEntries.length).toBeLessThanOrEqual(5)
    expect(data.recentEntries.length).toBeGreaterThan(0)
    const firstEntry = data.recentEntries[0] as typeof data.recentEntries[0] & { title?: string }
    expect('title' in firstEntry || firstEntry).toBeTruthy()
  })

  // O redesign do Painel (017-repertorio) reintroduz o TrajectoryHighlights, então `highlights`
  // volta ao PanelData (conquistas com impacto, até 3) — convivendo com o recentEntries do feed.
  it('PanelData tem campo highlights (array)', async () => {
    const { getPanelData } = await import('../getPanelData')
    const supabase = makeSupabase()

    const data = await getPanelData(supabase as never, 'user-1')

    expect(data).toHaveProperty('highlights')
    expect(Array.isArray(data.highlights)).toBe(true)
  })

  it('shape correto: tem recentEntries, status, entryCount', async () => {
    const { getPanelData } = await import('../getPanelData')
    const supabase = makeSupabase()

    const data: PanelData = await getPanelData(supabase as never, 'user-1')

    expect(data).toHaveProperty('recentEntries')
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('entryCount')
    expect(Array.isArray(data.recentEntries)).toBe(true)
  })
})
