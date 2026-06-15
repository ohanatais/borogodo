import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSuggestions } from '../getSuggestions'

const mockGetLatestSnapshot = vi.fn()
vi.mock('@/lib/db/mirror', () => ({
  getLatestSnapshot: (...args: unknown[]) => mockGetLatestSnapshot(...args),
}))

// Builder thenable por tabela: resolve conforme `from(table)`. Cada chamada de query devolve o
// resultado pré-configurado para aquela tabela.
function makeSupabase(fixtures: {
  insights?: unknown[]
  drafts?: unknown[]
  entries?: unknown[]
}) {
  function builder(result: unknown) {
    const q: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'order', 'limit'] as const) q[m] = vi.fn(() => q)
    q.then = (resolve: (v: unknown) => unknown) => resolve({ data: result, error: null })
    return q
  }
  return {
    from: vi.fn((table: string) => {
      if (table === 'proactive_insights') return builder(fixtures.insights ?? [])
      if (table === 'drafts') return builder(fixtures.drafts ?? [])
      if (table === 'entries') return builder(fixtures.entries ?? [])
      throw new Error(`unexpected table: ${table}`)
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetLatestSnapshot.mockResolvedValue(null)
})

describe('getSuggestions', () => {
  it('devolve [] quando não há material (faixa some)', async () => {
    const supabase = makeSupabase({})
    const result = await getSuggestions(supabase as never, 'user-1')
    expect(result).toEqual([])
  })

  it('inclui nudges pendentes, temas do espelho e entradas fortes — nudges primeiro', async () => {
    mockGetLatestSnapshot.mockResolvedValue({ strength_themes: ['produto 0→1'] })
    const supabase = makeSupabase({
      insights: [{ id: 'i1', headline: 'Lancei o app', entry_ids: ['e-strong'] }],
      drafts: [],
      entries: [{ id: 'e2', what_i_did: 'Fechei contrato', impact: 'Receita nova', metric: null }],
    })

    const result = await getSuggestions(supabase as never, 'user-1')

    expect(result[0].kind).toBe('nudge')
    expect(result[0].seedRef).toBe('e-strong')
    expect(result[0].insightId).toBe('i1')
    expect(result.some((s) => s.kind === 'theme' && s.seedRef === 'produto 0→1')).toBe(true)
    expect(result.some((s) => s.kind === 'entry' && s.seedRef === 'e2')).toBe(true)
  })

  it('exclui temas/entradas que já viraram rascunho', async () => {
    mockGetLatestSnapshot.mockResolvedValue({ strength_themes: ['produto 0→1'] })
    const supabase = makeSupabase({
      insights: [],
      drafts: [{ seed_ref: 'produto 0→1' }, { seed_ref: 'e2' }],
      entries: [{ id: 'e2', what_i_did: 'Fechei contrato', impact: 'Receita', metric: null }],
    })

    const result = await getSuggestions(supabase as never, 'user-1')

    expect(result).toEqual([])
  })

  it('ignora entradas fracas (sem impacto/métrica)', async () => {
    const supabase = makeSupabase({
      entries: [{ id: 'e3', what_i_did: 'Reunião de status', impact: null, metric: null }],
    })
    const result = await getSuggestions(supabase as never, 'user-1')
    expect(result).toEqual([])
  })

  it('limita a no máximo 3 sugestões', async () => {
    mockGetLatestSnapshot.mockResolvedValue({ strength_themes: ['t1', 't2', 't3', 't4'] })
    const supabase = makeSupabase({
      insights: [{ id: 'i1', headline: 'h', entry_ids: ['e1'] }],
      entries: [],
    })
    const result = await getSuggestions(supabase as never, 'user-1')
    expect(result).toHaveLength(3)
  })
})
