import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveEntries } from '../entries'
import type { ExtractedEntry } from '@/types/entry'

vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn().mockResolvedValue(Array(1536).fill(0.1)),
  cosineSimilarity: vi.fn().mockReturnValue(0),
  parseEmbedding: vi.fn((raw: unknown) => (Array.isArray(raw) ? raw : null)),
}))

vi.mock('@/lib/log', () => ({
  logger: { error: vi.fn() },
}))

const BASE_ENTRY: ExtractedEntry = {
  what_i_did: 'Liderou roadmap do produto',
  company: 'Acme Corp',
  role_title: 'PM',
  role_start: '2023-01-01',
  role_end: null,
  project_name: null,
  impact: null,
  metric: null,
  decision: null,
  learning: null,
  entry_date: null,
  tags: ['product'],
  raw_content: 'raw',
  source: 'text',
}

// Mock encadeado: cada método do query builder devolve o próprio builder; o builder é "thenable"
// e resolve conforme as colunas pedidas no select. Captura as linhas passadas ao insert.
function makeEntriesClient({
  existingTexts = [] as string[],
  poolEmbeddings = [] as number[][],
  inserted = null as unknown[] | null,
  insertError = null as unknown,
} = {}) {
  const captured: { insertRows: unknown[] | null } = { insertRows: null }

  function makeBuilder(result: { data: unknown; error: unknown }) {
    const builder: Record<string, unknown> = {}
    for (const m of ['eq', 'not', 'is', 'order', 'limit'] as const) {
      builder[m] = vi.fn(() => builder)
    }
    builder.then = (resolve: (v: unknown) => unknown) => resolve(result)
    return builder
  }

  const client = {
    from: vi.fn((table: string) => {
      if (table !== 'entries') throw new Error(`Unexpected table: ${table}`)
      return {
        select: vi.fn((cols?: string) => {
          if (cols === 'embedding') {
            return makeBuilder({ data: poolEmbeddings.map((e) => ({ embedding: e })), error: null })
          }
          return makeBuilder({ data: existingTexts.map((t) => ({ what_i_did: t })), error: null })
        }),
        insert: vi.fn((rows: unknown[]) => {
          captured.insertRows = rows
          return { select: vi.fn(() => makeBuilder({ data: inserted ?? rows, error: insertError })) }
        }),
      }
    }),
  }

  return { client, captured }
}

describe('saveEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when entries list is empty', async () => {
    const { client } = makeEntriesClient()
    const result = await saveEntries(client as never, 'user-1', [])
    expect(result).toEqual([])
  })

  it('filters out entries whose what_i_did matches an existing entry exactly', async () => {
    const { client } = makeEntriesClient({ existingTexts: ['Liderou roadmap do produto'] })
    const result = await saveEntries(client as never, 'user-1', [BASE_ENTRY])
    expect(result).toEqual([])
  })

  it('filters out near-identical entries (só diferem em pontuação/caixa) — conserto do bug de duplicação', async () => {
    const { client } = makeEntriesClient({ existingTexts: ['Saí de zero GitHub pra borogodo.ai no ar, sozinha.'] })
    const nearDup: ExtractedEntry = {
      ...BASE_ENTRY,
      company: null,
      what_i_did: 'Saí de zero GitHub pra borogodo.ai no ar sozinha',
    }
    const result = await saveEntries(client as never, 'user-1', [nearDup])
    expect(result).toEqual([])
  })

  it('saves new entries that do not match existing texts', async () => {
    const saved = [{ id: 'new-id', ...BASE_ENTRY, user_id: 'user-1', embedding: null }]
    const { client } = makeEntriesClient({ inserted: saved })
    const result = await saveEntries(client as never, 'user-1', [BASE_ENTRY])
    expect(result).toEqual(saved)
  })

  it('roda o dedup semântico mesmo SEM empresa (conserto: antes era pulado)', async () => {
    const { generateEmbedding, cosineSimilarity } = await import('@/lib/ai/embeddings')
    vi.mocked(cosineSimilarity).mockReturnValue(0.95) // acima do limiar → duplicado
    const entryWithoutCompany: ExtractedEntry = { ...BASE_ENTRY, company: null, what_i_did: 'algo único' }
    const { client } = makeEntriesClient({ poolEmbeddings: [Array(1536).fill(0.2)] })

    const result = await saveEntries(client as never, 'user-1', [entryWithoutCompany])

    expect(generateEmbedding).toHaveBeenCalledWith('algo único')
    expect(result).toEqual([]) // descartado pela similaridade
  })

  it('descarta a entrada quando há duplicata semântica no pool de recentes', async () => {
    const { cosineSimilarity } = await import('@/lib/ai/embeddings')
    vi.mocked(cosineSimilarity).mockReturnValue(0.97)
    const { client } = makeEntriesClient({ poolEmbeddings: [Array(1536).fill(0.2)] })
    const result = await saveEntries(client as never, 'user-1', [BASE_ENTRY])
    expect(result).toEqual([])
  })

  it('deduplica dentro do mesmo lote (duas iguais → salva uma só)', async () => {
    const { client, captured } = makeEntriesClient()
    const dupBatch: ExtractedEntry[] = [
      { ...BASE_ENTRY, what_i_did: 'Entreguei 9 features na main' },
      { ...BASE_ENTRY, what_i_did: 'Entreguei 9 features na main.' }, // só muda o ponto
    ]
    await saveEntries(client as never, 'user-1', dupBatch)
    expect(captured.insertRows).toHaveLength(1)
  })

  it('still saves entry when embedding generation fails', async () => {
    const { generateEmbedding } = await import('@/lib/ai/embeddings')
    vi.mocked(generateEmbedding).mockRejectedValueOnce(new Error('OpenAI timeout'))
    const saved = [{ id: 'id-1', ...BASE_ENTRY, user_id: 'user-1', embedding: null }]
    const { client } = makeEntriesClient({ inserted: saved })
    const result = await saveEntries(client as never, 'user-1', [BASE_ENTRY])
    expect(result).toEqual(saved)
  })

  it('throws when insert fails', async () => {
    const { client } = makeEntriesClient({ insertError: { message: 'db error' } })
    await expect(saveEntries(client as never, 'user-1', [BASE_ENTRY])).rejects.toThrow(
      'Não foi possível salvar a entrada'
    )
  })
})
