import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveEntries, getRecentEntries, enrichEntryField } from '@/lib/db/entries'
import type { ExtractedEntry } from '@/types/entry'

vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn().mockResolvedValue(Array(1536).fill(0)),
  cosineSimilarity: vi.fn().mockReturnValue(0),
  parseEmbedding: vi.fn((raw: unknown) => (Array.isArray(raw) ? raw : null)),
}))

interface FakeQuery {
  insert: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
}

function buildChainableQuery(result: { data: unknown; error: unknown }): FakeQuery {
  const query = {} as FakeQuery
  query.insert = vi.fn(() => query)
  query.select = vi.fn(() => query)
  query.eq = vi.fn(() => query)
  query.order = vi.fn(() => query)
  query.update = vi.fn(() => query)
  query.limit = vi.fn(async () => result)
  query.maybeSingle = vi.fn(async () => result)
  return query
}

function buildSupabase(result: { data: unknown; error: unknown }): { from: ReturnType<typeof vi.fn>; query: FakeQuery } {
  const query = buildChainableQuery(result)
  const from = vi.fn(() => query)
  return { from, query } as unknown as { from: ReturnType<typeof vi.fn>; query: FakeQuery }
}

const EXTRACTED: ExtractedEntry = {
  what_i_did: 'Fechei a migração do banco no prazo',
  decision: null,
  learning: null,
  impact: null,
  metric: null,
  entry_date: null,
  tags: ['migração'],
  raw_content: 'Fechei a migração do banco no prazo',
  source: 'text',
}

const SAVED_ENTRY = { ...EXTRACTED, id: 'entry-1', user_id: 'user-1', created_at: 't', updated_at: 't' }

function buildSaveEntriesSupabase(
  existingItems: Array<{ what_i_did: string }>,
  insertResult: { data: unknown; error: unknown }
) {
  // First from('entries') call: dedup SELECT → .select().eq() awaitable
  const dedupChain = {
    select: vi.fn(function(this: unknown) { return dedupChain }),
    eq: vi.fn(async () => ({ data: existingItems, error: null })),
  }
  // Second from('entries') call: INSERT → .insert().select() awaitable
  const insertChain = {
    insert: vi.fn(function(this: unknown) { return insertChain }),
    select: vi.fn(async () => insertResult),
  }
  let call = 0
  const from = vi.fn(() => (call++ === 0 ? dedupChain : insertChain))
  return { from, insertChain }
}

describe('saveEntries', () => {
  beforeEach(() => vi.clearAllMocks())

  it('insere as entradas com user_id e retorna as linhas salvas', async () => {
    const { from, insertChain } = buildSaveEntriesSupabase([], { data: [SAVED_ENTRY], error: null })

    const supabase = { from } as unknown as Parameters<typeof saveEntries>[0]
    const result = await saveEntries(supabase, 'user-1', [EXTRACTED])

    expect(from).toHaveBeenCalledWith('entries')
    expect(insertChain.insert).toHaveBeenCalledWith([{ ...EXTRACTED, user_id: 'user-1', embedding: null }])
    expect(result).toEqual([SAVED_ENTRY])
  })

  it('filtra entradas duplicadas antes de inserir', async () => {
    const { from, insertChain } = buildSaveEntriesSupabase(
      [{ what_i_did: EXTRACTED.what_i_did }],
      { data: [], error: null }
    )

    const supabase = { from } as unknown as Parameters<typeof saveEntries>[0]
    const result = await saveEntries(supabase, 'user-1', [EXTRACTED])

    expect(insertChain.insert).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('lança erro quando o insert falha', async () => {
    const { from } = buildSaveEntriesSupabase([], { data: null, error: new Error('boom') })

    const supabase = { from } as unknown as Parameters<typeof saveEntries>[0]

    await expect(saveEntries(supabase, 'user-1', [EXTRACTED])).rejects.toThrow('Não foi possível salvar a entrada')
  })
})

describe('getRecentEntries', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna as entradas mais recentes do usuário', async () => {
    const { from, query } = buildSupabase({ data: [SAVED_ENTRY], error: null })

    const supabase = { from } as unknown as Parameters<typeof getRecentEntries>[0]
    const result = await getRecentEntries(supabase, 'user-1', 5)

    expect(from).toHaveBeenCalledWith('entries')
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(query.limit).toHaveBeenCalledWith(5)
    expect(result).toEqual([SAVED_ENTRY])
  })

  it('retorna array vazio quando a consulta falha (tolerante)', async () => {
    const { from } = buildSupabase({ data: null, error: new Error('boom') })

    const supabase = { from } as unknown as Parameters<typeof getRecentEntries>[0]
    const result = await getRecentEntries(supabase, 'user-1', 5)

    expect(result).toEqual([])
  })
})

describe('enrichEntryField', () => {
  beforeEach(() => vi.clearAllMocks())

  it('atualiza o campo e retorna a entrada atualizada', async () => {
    const updated = { ...SAVED_ENTRY, metric: 'Reduziu o tempo de deploy em 40%' }
    const { from, query } = buildSupabase({ data: updated, error: null })

    const supabase = { from } as unknown as Parameters<typeof enrichEntryField>[0]
    const result = await enrichEntryField(supabase, 'entry-1', 'metric', 'Reduziu o tempo de deploy em 40%')

    expect(from).toHaveBeenCalledWith('entries')
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ metric: 'Reduziu o tempo de deploy em 40%' })
    )
    expect(query.eq).toHaveBeenCalledWith('id', 'entry-1')
    expect(result).toEqual(updated)
  })

  it('retorna null quando nenhuma linha é afetada (entrada inexistente ou de outro usuário, RLS)', async () => {
    const { from } = buildSupabase({ data: null, error: null })

    const supabase = { from } as unknown as Parameters<typeof enrichEntryField>[0]
    const result = await enrichEntryField(supabase, 'entry-de-outro-usuario', 'metric', 'qualquer coisa')

    expect(result).toBeNull()
  })
})
