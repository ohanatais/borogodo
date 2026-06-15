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

function makeInsertChain(insertedData: unknown[], insertError: unknown = null) {
  return {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: insertedData, error: insertError }),
    }),
  }
}

function makeSupabase({
  existingTexts = [] as string[],
  existingEmbeddings = [] as Array<{ embedding: unknown }>,
  insertedData = [] as unknown[],
  insertError = null as unknown,
} = {}) {
  const fromMock = vi.fn((table: string) => {
    if (table !== 'entries') throw new Error(`Unexpected table: ${table}`)
    return {
      select: vi.fn((cols?: string) => {
        // exact dedup query — selects what_i_did
        if (!cols || cols === 'what_i_did') {
          return {
            eq: vi.fn().mockResolvedValue({
              data: existingTexts.map((t) => ({ what_i_did: t })),
              error: null,
            }),
          }
        }
        // semantic dedup query — selects embedding
        return {
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ data: existingEmbeddings, error: null }),
                eq: vi.fn().mockResolvedValue({ data: existingEmbeddings, error: null }),
              }),
              is: vi.fn().mockResolvedValue({ data: existingEmbeddings, error: null }),
            }),
            not: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({ data: existingEmbeddings, error: null }),
              eq: vi.fn().mockResolvedValue({ data: existingEmbeddings, error: null }),
            }),
          }),
        }
      }),
      ...makeInsertChain(insertedData, insertError),
    }
  })
  return { from: fromMock }
}

describe('saveEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when entries list is empty', async () => {
    const supabase = makeSupabase()
    const result = await saveEntries(supabase as never, 'user-1', [])
    expect(result).toEqual([])
  })

  it('filters out entries whose what_i_did matches an existing entry exactly', async () => {
    const supabase = makeSupabase({
      existingTexts: ['Liderou roadmap do produto'],
      insertedData: [],
    })
    const result = await saveEntries(supabase as never, 'user-1', [BASE_ENTRY])
    expect(result).toEqual([])
  })

  it('saves new entries that do not match existing texts', async () => {
    const saved = [{ id: 'new-id', ...BASE_ENTRY, user_id: 'user-1', embedding: null }]
    const supabase = makeSupabase({
      existingTexts: [],
      insertedData: saved,
    })
    const result = await saveEntries(supabase as never, 'user-1', [BASE_ENTRY])
    expect(result).toEqual(saved)
  })

  it('skips semantic dedup for entries without company', async () => {
    const { generateEmbedding } = await import('@/lib/ai/embeddings')
    const entryWithoutCompany: ExtractedEntry = { ...BASE_ENTRY, company: null }
    const saved = [{ id: 'id-1', ...entryWithoutCompany, user_id: 'user-1', embedding: null }]
    const supabase = makeSupabase({ insertedData: saved })
    await saveEntries(supabase as never, 'user-1', [entryWithoutCompany])
    expect(generateEmbedding).not.toHaveBeenCalled()
  })

  it('throws when insert fails', async () => {
    const supabase = makeSupabase({ insertError: { message: 'db error' }, insertedData: [] })
    await expect(saveEntries(supabase as never, 'user-1', [BASE_ENTRY])).rejects.toThrow(
      'Não foi possível salvar a entrada'
    )
  })

  it('generates embedding for entries with company', async () => {
    const { generateEmbedding } = await import('@/lib/ai/embeddings')
    const saved = [{ id: 'id-1', ...BASE_ENTRY, user_id: 'user-1' }]
    const supabase = makeSupabase({ insertedData: saved })
    await saveEntries(supabase as never, 'user-1', [BASE_ENTRY])
    expect(generateEmbedding).toHaveBeenCalledWith(BASE_ENTRY.what_i_did)
  })

  it('still saves entry when embedding generation fails', async () => {
    const { generateEmbedding } = await import('@/lib/ai/embeddings')
    vi.mocked(generateEmbedding).mockRejectedValueOnce(new Error('OpenAI timeout'))
    const saved = [{ id: 'id-1', ...BASE_ENTRY, user_id: 'user-1', embedding: null }]
    const supabase = makeSupabase({ insertedData: saved })
    const result = await saveEntries(supabase as never, 'user-1', [BASE_ENTRY])
    expect(result).toEqual(saved)
  })

  it('discards entry when semantic duplicate is found', async () => {
    const { generateEmbedding, cosineSimilarity } = await import('@/lib/ai/embeddings')
    const existingEmbedding = Array(1536).fill(0.2)
    vi.mocked(generateEmbedding).mockResolvedValueOnce(existingEmbedding)
    vi.mocked(cosineSimilarity).mockReturnValueOnce(0.95)

    const supabase = makeSupabase({
      existingEmbeddings: [{ embedding: existingEmbedding }],
      insertedData: [],
    })
    const result = await saveEntries(supabase as never, 'user-1', [BASE_ENTRY])
    expect(result).toEqual([])
  })
})
