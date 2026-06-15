import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listDrafts, deleteDraft } from '../drafts'

// Mock encadeado do query builder do Supabase. Cada método devolve `this` até o terminador,
// que resolve com { data, error }. Capturamos as chamadas para asserir escopo/filtro/paginação.
function makeQuery(result: { data: unknown; error: unknown }) {
  const calls: Record<string, unknown[]> = {}
  const record = (name: string, args: unknown[]) => {
    calls[name] = args
  }
  const builder: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'neq', 'order', 'limit', 'lt'] as const) {
    builder[m] = vi.fn((...args: unknown[]) => {
      record(m, args)
      return builder
    })
  }
  // `limit` é o terminador da leitura paginada: torna o builder "thenable".
  builder.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return { builder, calls }
}

const ROW = {
  id: 'd1',
  format: 'post',
  seed_type: 'theme',
  seed_ref: 'produto 0→1',
  angle: 'o aprendizado',
  body: 'corpo',
  status: 'generated',
  voice_feedback: null,
  created_at: '2026-06-15T12:00:00Z',
}

describe('listDrafts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('escopa por user_id, ordena por mais recente e aplica teto de limite', async () => {
    const { builder, calls } = makeQuery({ data: [ROW], error: null })
    const supabase = { from: vi.fn(() => builder) }

    const page = await listDrafts(supabase as never, 'user-1', { limit: 10 })

    expect(supabase.from).toHaveBeenCalledWith('drafts')
    expect(calls.eq).toEqual(['user_id', 'user-1'])
    expect(calls.order?.[0]).toBe('created_at')
    // pede limit+1 para saber se há próxima página
    expect(calls.limit?.[0]).toBe(11)
    expect(page.items).toHaveLength(1)
    expect(page.items[0].id).toBe('d1')
    expect(page.nextCursor).toBeNull()
  })

  it('por padrão (ativos) exclui os arquivados (discarded)', async () => {
    const { builder, calls } = makeQuery({ data: [ROW], error: null })
    const supabase = { from: vi.fn(() => builder) }

    await listDrafts(supabase as never, 'user-1', {})

    expect(calls.neq).toEqual(['status', 'discarded'])
  })

  it('filtro "arquivados" pede explicitamente os discarded', async () => {
    const { builder, calls } = makeQuery({ data: [], error: null })
    const supabase = { from: vi.fn(() => builder) }

    await listDrafts(supabase as never, 'user-1', { status: 'arquivados' })

    expect(calls.eq).toContain('discarded')
    expect(calls.neq).toBeUndefined()
  })

  it('filtro "copiados" pede status=copied', async () => {
    const { builder, calls } = makeQuery({ data: [], error: null })
    const supabase = { from: vi.fn(() => builder) }

    await listDrafts(supabase as never, 'user-1', { status: 'copiados' })

    expect(calls.eq).toContain('copied')
  })

  it('devolve nextCursor quando há mais de uma página', async () => {
    // limit=1 → pedimos 2; vêm 2 → há próxima página, o cursor é o created_at do último item devolvido
    const rows = [
      { ...ROW, id: 'd1', created_at: '2026-06-15T12:00:00Z' },
      { ...ROW, id: 'd2', created_at: '2026-06-14T12:00:00Z' },
    ]
    const { builder } = makeQuery({ data: rows, error: null })
    const supabase = { from: vi.fn(() => builder) }

    const page = await listDrafts(supabase as never, 'user-1', { limit: 1 })

    expect(page.items).toHaveLength(1)
    expect(page.items[0].id).toBe('d1')
    expect(page.nextCursor).toBe('2026-06-15T12:00:00Z')
  })

  it('aplica o cursor (keyset por created_at) na página seguinte', async () => {
    const { builder, calls } = makeQuery({ data: [], error: null })
    const supabase = { from: vi.fn(() => builder) }

    await listDrafts(supabase as never, 'user-1', { cursor: '2026-06-15T12:00:00Z' })

    expect(calls.lt).toEqual(['created_at', '2026-06-15T12:00:00Z'])
  })

  it('devolve página vazia em erro (sem quebrar o hub)', async () => {
    const { builder } = makeQuery({ data: null, error: { message: 'db down' } })
    const supabase = { from: vi.fn(() => builder) }

    const page = await listDrafts(supabase as never, 'user-1', {})

    expect(page.items).toEqual([])
    expect(page.nextCursor).toBeNull()
  })
})

describe('deleteDraft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exclui filtrando por id E user_id (RLS de delete) e devolve true', async () => {
    const calls: Record<string, unknown[]> = {}
    const eq2 = vi.fn((...a: unknown[]) => {
      calls.eq2 = a
      return Promise.resolve({ error: null })
    })
    const eq1 = vi.fn((...a: unknown[]) => {
      calls.eq1 = a
      return { eq: eq2 }
    })
    const del = vi.fn(() => ({ eq: eq1 }))
    const supabase = { from: vi.fn(() => ({ delete: del })) }

    const ok = await deleteDraft(supabase as never, 'user-1', 'd1')

    expect(supabase.from).toHaveBeenCalledWith('drafts')
    expect(calls.eq1).toEqual(['id', 'd1'])
    expect(calls.eq2).toEqual(['user_id', 'user-1'])
    expect(ok).toBe(true)
  })

  it('devolve false quando o delete falha (id alheio não apaga nada — sem throw)', async () => {
    const eq2 = vi.fn(() => Promise.resolve({ error: { message: 'no rows' } }))
    const eq1 = vi.fn(() => ({ eq: eq2 }))
    const supabase = { from: vi.fn(() => ({ delete: vi.fn(() => ({ eq: eq1 })) })) }

    const ok = await deleteDraft(supabase as never, 'user-1', 'other-id')

    expect(ok).toBe(false)
  })
})
