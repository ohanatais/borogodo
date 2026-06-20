import { describe, it, expect, vi } from 'vitest'
import { loadPeriodRecap } from '../periodRecap'

interface Row {
  id: string
  what_i_did: string
  entry_date: string | null
  created_at: string
}

/** Builder encadeável mínimo (espelha o padrão do loadSeed.test): cada passo devolve o builder. */
function makeSupabase(rows: Row[]) {
  const calls: { from: string[]; eq: unknown[][] } = { from: [], eq: [] }
  const builder: Record<string, unknown> = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn((...a: unknown[]) => {
    calls.eq.push(a)
    return builder
  })
  builder.order = vi.fn(() => builder)
  builder.limit = vi.fn(() => builder)
  builder.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error: null })
  const supabase = {
    from: vi.fn((table: string) => {
      calls.from.push(table)
      return builder
    }),
  }
  return { supabase, calls }
}

const ROWS: Row[] = [
  { id: 'e1', what_i_did: 'Liderei o lançamento do app', entry_date: '2025-03-10', created_at: '2025-03-11T00:00:00Z' },
  { id: 'e2', what_i_did: 'Conduzi a pesquisa com 12 clientes', entry_date: null, created_at: '2025-05-02T00:00:00Z' },
]

describe('loadPeriodRecap — recap determinístico (US1, 019)', () => {
  it('cada item carrega texto factual, a fonte (entry id) e quando ocorreu', async () => {
    const { supabase } = makeSupabase(ROWS)

    const recap = await loadPeriodRecap(supabase as never, 'user-1', '2025-01-01', '2025-12-31')

    expect(recap.isLimited).toBe(false)
    expect(recap.items).toHaveLength(2)
    expect(recap.items[0]).toEqual({
      text: 'Liderei o lançamento do app',
      sourceEntryId: 'e1',
      occurredAt: '2025-03-10',
    })
  })

  it('usa created_at como occurredAt quando a entrada não tem entry_date (e ainda entra no período)', async () => {
    const { supabase } = makeSupabase(ROWS)
    const recap = await loadPeriodRecap(supabase as never, 'user-1', '2025-01-01', '2025-12-31')
    expect(recap.items[1].occurredAt).toBe('2025-05-02T00:00:00Z')
  })

  it('o texto é o registro cru, sem adjetivo nem síntese (transformação de apresentação)', async () => {
    const { supabase } = makeSupabase(ROWS)
    const recap = await loadPeriodRecap(supabase as never, 'user-1', '2025-01-01', '2025-12-31')
    expect(recap.items.map((i) => i.text)).toEqual([
      'Liderei o lançamento do app',
      'Conduzi a pesquisa com 12 clientes',
    ])
  })

  it('recorta pelo período por dia (YYYY-MM-DD): exclui o que está fora, estável a fuso', async () => {
    const rows: Row[] = [
      { id: 'in', what_i_did: 'Dentro do período', entry_date: '2025-06-15', created_at: '2025-06-15T00:00:00Z' },
      { id: 'out', what_i_did: 'Fora do período', entry_date: '2024-01-01', created_at: '2024-01-01T00:00:00Z' },
    ]
    const { supabase } = makeSupabase(rows)
    const recap = await loadPeriodRecap(supabase as never, 'user-1', '2025-01-01', '2025-12-31')
    expect(recap.items.map((i) => i.sourceEntryId)).toEqual(['in'])
  })

  it('período sem registros → isLimited true e zero itens (não fabrica)', async () => {
    const { supabase } = makeSupabase([])
    const recap = await loadPeriodRecap(supabase as never, 'user-1', '2025-01-01', '2025-12-31')
    expect(recap.isLimited).toBe(true)
    expect(recap.items).toHaveLength(0)
  })

  it('lê de `entries` escopado por user_id — nunca de `drafts`', async () => {
    const { supabase, calls } = makeSupabase(ROWS)
    await loadPeriodRecap(supabase as never, 'user-1', '2025-01-01', '2025-12-31')
    expect(calls.from).toEqual(['entries'])
    expect(calls.from).not.toContain('drafts')
    expect(calls.eq).toContainEqual(['user_id', 'user-1'])
  })
})
