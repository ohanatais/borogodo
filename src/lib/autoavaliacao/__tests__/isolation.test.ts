import { describe, it, expect, vi } from 'vitest'
import { loadPeriodRecap } from '../periodRecap'

/**
 * Isolamento (US1, FR): a autoavaliação ESCRITA pela pessoa vive em `drafts` (format='self_assessment',
 * status='draft') e é texto humano interpretativo. Ela NUNCA pode realimentar o recap como se fosse um
 * fato registrado — senão a interpretação da pessoa viraria "evidência" e o sistema reforçaria a si
 * mesmo. O recap só colhe de `entries` (capturas reais). Este teste prova essa fronteira.
 */
function makeSupabase(entriesRows: unknown[]) {
  const tablesQueried: string[] = []
  function builderFor(rows: unknown[]): Record<string, unknown> {
    const b: Record<string, unknown> = {}
    b.select = vi.fn(() => b)
    b.eq = vi.fn(() => b)
    b.gte = vi.fn(() => b)
    b.lte = vi.fn(() => b)
    b.order = vi.fn(() => b)
    b.limit = vi.fn(() => b)
    b.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error: null })
    return b
  }
  const supabase = {
    from: vi.fn((table: string) => {
      tablesQueried.push(table)
      // Se alguém consultar `drafts` aqui, devolveria a autoavaliação escrita — o que seria o vazamento.
      return builderFor(table === 'entries' ? entriesRows : [{ id: 'd1', what_i_did: 'NUNCA DEVE APARECER' }])
    }),
  }
  return { supabase, tablesQueried }
}

describe('isolamento autoavaliação ↔ espelho/recap (US1, 019)', () => {
  it('o recap colhe só de `entries`; a autoavaliação escrita (drafts) jamais entra como evidência', async () => {
    const entries = [
      { id: 'e1', what_i_did: 'Liderei o lançamento', entry_date: '2025-03-10', created_at: '2025-03-11T00:00:00Z' },
    ]
    const { supabase, tablesQueried } = makeSupabase(entries)

    const recap = await loadPeriodRecap(supabase as never, 'user-1', '2025-01-01', '2025-12-31')

    expect(tablesQueried).toEqual(['entries'])
    expect(tablesQueried).not.toContain('drafts')
    expect(recap.items.every((i) => i.text !== 'NUNCA DEVE APARECER')).toBe(true)
    expect(recap.items[0].sourceEntryId).toBe('e1')
  })
})
