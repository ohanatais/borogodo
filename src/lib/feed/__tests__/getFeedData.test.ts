import { describe, it, expect, vi } from 'vitest'
import { getFeedData } from '../getFeedData'
import type { FeedQuery } from '../types'

function makeMockEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'entry-1',
    what_i_did: 'Liderou roadmap do produto',
    title: null,
    source: 'text' as const,
    created_at: '2025-01-01T10:00:00Z',
    entry_date: null,
    company: null,
    role_title: null,
    metric: null,
    tags: [],
    evidences: [],
    impact: null,
    decision: null,
    learning: null,
    ...overrides,
  }
}

function makeSupabase(rows: unknown[], { error = null }: { error?: unknown } = {}) {
  const builder: Record<string, unknown> = {}

  const chainMethods = ['eq', 'neq', 'not', 'is', 'order', 'limit', 'ilike', 'contains', 'gte', 'lte', 'or', 'lt', 'gt'] as const
  for (const m of chainMethods) {
    builder[m] = vi.fn(() => builder)
  }

  builder.then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: rows, error })

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => builder),
    })),
  }
}

const DEFAULT_QUERY: FeedQuery = { axis: 'created_at' }

describe('getFeedData — eixo entry_date (US2)', () => {
  it('eixo entry_date ordena por entry_date DESC NULLS LAST', async () => {
    const entries = [
      makeMockEntry({ id: 'e1', entry_date: '2025-03-01', created_at: '2025-03-02T00:00:00Z' }),
      makeMockEntry({ id: 'e2', entry_date: null, created_at: '2025-03-01T00:00:00Z' }),
    ]
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', { axis: 'entry_date' })

    expect(result.items).toHaveLength(2)
    expect(result.items.map((i) => i.id).sort()).toEqual(['e1', 'e2'])
  })

  it('entradas sem entry_date nunca somem (aparecem ao final com eixo entry_date)', async () => {
    const entries = [
      makeMockEntry({ id: 'e1', entry_date: '2025-03-01', created_at: '2025-01-01T00:00:00Z' }),
      makeMockEntry({ id: 'e2', entry_date: null, created_at: '2025-03-01T00:00:00Z' }),
    ]
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', { axis: 'entry_date' })

    const ids = result.items.map((i) => i.id)
    expect(ids).toContain('e1')
    expect(ids).toContain('e2')
  })
})

describe('getFeedData', () => {
  it('retorna FeedPage com items para o userId correto', async () => {
    const entry = makeMockEntry()
    const supabase = makeSupabase([entry])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('entry-1')
    expect(supabase.from).toHaveBeenCalledWith('entries')
  })

  it('título nunca é vazio — fallback determinístico quando title é null', async () => {
    const entry = makeMockEntry({ title: null, what_i_did: 'Conduziu discovery com stakeholders' })
    const supabase = makeSupabase([entry])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items[0].title).toBeTruthy()
    expect(result.items[0].title).toBe('Conduziu discovery com stakeholders')
  })

  it('título nunca é vazio — usa title IA quando presente', async () => {
    const entry = makeMockEntry({ title: 'Lançou redesign do checkout', what_i_did: 'O texto longo aqui' })
    const supabase = makeSupabase([entry])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items[0].title).toBe('Lançou redesign do checkout')
  })

  it('fallback de título trunca what_i_did em 60 chars', async () => {
    const longText = 'a'.repeat(100)
    const entry = makeMockEntry({ title: null, what_i_did: longText })
    const supabase = makeSupabase([entry])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items[0].title.length).toBeLessThanOrEqual(60)
  })

  it('retorna nextCursor null quando há menos items que o page size', async () => {
    const entries = Array.from({ length: 5 }, (_, i) => makeMockEntry({ id: `entry-${i}` }))
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.nextCursor).toBeNull()
  })

  it('retorna nextCursor quando há mais items que o page size', async () => {
    const entries = Array.from({ length: 21 }, (_, i) =>
      makeMockEntry({ id: `entry-${i}`, created_at: `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z` })
    )
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items).toHaveLength(20)
    expect(result.nextCursor).not.toBeNull()
  })

  it('extrai thumbnail da primeira evidence de tipo image', async () => {
    const entry = makeMockEntry({
      evidences: [
        { type: 'url', value: 'https://example.com', label: 'Link' },
        { type: 'image', value: 'https://img.example.com/foto.jpg', label: 'Foto' },
      ],
    })
    const supabase = makeSupabase([entry])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items[0].thumbnail).toBe('https://img.example.com/foto.jpg')
  })

  it('thumbnail é null quando não há evidências de tipo image', async () => {
    const entry = makeMockEntry({
      evidences: [{ type: 'url', value: 'https://example.com', label: 'Link' }],
    })
    const supabase = makeSupabase([entry])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items[0].thumbnail).toBeNull()
  })
})
