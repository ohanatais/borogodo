import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockComplete = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())
const mockGetSupabaseAdmin = vi.hoisted(() => vi.fn())

// 023: a geração do insight passa pelo guard (`client.complete`). Mockamos ele direto.
vi.mock('@/lib/ai/client', () => ({
  complete: mockComplete,
}))

vi.mock('@/lib/db/supabaseAdmin', () => ({
  getSupabaseAdmin: mockGetSupabaseAdmin,
}))

import { triggerProactiveInsight } from '@/lib/ai/insights/triggerProactiveInsight'

const RECENT_ENTRIES = [
  { id: 'e1', what_i_did: 'Mediou conflito entre áreas', tags: ['mediação'], impact: null },
  { id: 'e2', what_i_did: 'Apresentou plano pro board', tags: ['comunicação'], impact: 'Aprovado sem ressalvas' },
]

const VALID_DRAFT = {
  type: 'invisible_skill',
  headline: 'Você medeia conflitos com leveza',
  body: 'Em 2 situações recentes você resolveu impasses entre áreas sem escalar.',
  entry_indexes: [0, 1],
}

function jsonBlock(payload: unknown): string {
  return '```json\n' + JSON.stringify(payload) + '\n```'
}

interface QueryFixture {
  count?: number
  list?: unknown[]
  insertedId?: string
}

function buildAdmin({ count, list, insertedId }: QueryFixture) {
  const insertSingle = vi.fn(async () => ({
    data: { id: insertedId ?? 'insight-1', user_id: 'user-1', ...VALID_DRAFT, entry_ids: ['e1', 'e2'], seen: false, generated_at: '2026-06-07' },
    error: null,
  }))
  const insertSelect = vi.fn(() => ({ single: insertSingle }))
  const insert = vi.fn(() => ({ select: insertSelect }))

  const countChain: Record<string, unknown> = {
    eq: vi.fn(() => countChain),
    then: (resolve: (value: { count?: number; error: unknown }) => unknown) =>
      resolve({ count, error: null }),
  }
  countChain.select = vi.fn(() => countChain)

  const listChain: Record<string, unknown> = {
    eq: vi.fn(() => listChain),
    order: vi.fn(() => listChain),
    limit: vi.fn(() => listChain),
    then: (resolve: (value: { data: unknown[]; error: unknown }) => unknown) =>
      resolve({ data: list ?? [], error: null }),
  }
  listChain.select = vi.fn(() => listChain)

  mockFrom.mockImplementation((table: string) => {
    if (table === 'proactive_insights') return { select: countChain.select, insert }
    if (table === 'entries') return { select: listChain.select }
    throw new Error(`unexpected table: ${table}`)
  })

  return { from: mockFrom, insert, insertSelect, insertSingle }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSupabaseAdmin.mockReturnValue(buildAdmin({ count: 0, list: RECENT_ENTRIES }))
})

describe('triggerProactiveInsight', () => {
  it('generates and persists an insight when there is no unseen one yet', async () => {
    mockComplete.mockResolvedValue(jsonBlock(VALID_DRAFT))
    const admin = buildAdmin({ count: 0, list: RECENT_ENTRIES })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await triggerProactiveInsight('user-1')

    expect(mockComplete).toHaveBeenCalledOnce()
    expect(admin.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        type: 'invisible_skill',
        headline: VALID_DRAFT.headline,
        entry_ids: ['e1', 'e2'],
      })
    )
  })

  it('does not generate a new insight when one is already unseen', async () => {
    const admin = buildAdmin({ count: 1, list: RECENT_ENTRIES })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await triggerProactiveInsight('user-1')

    expect(mockComplete).not.toHaveBeenCalled()
    expect(admin.insert).not.toHaveBeenCalled()
  })

  it('does not throw when the provider fails — logs and gives up quietly', async () => {
    mockComplete.mockRejectedValue(new Error('provider unavailable'))
    const admin = buildAdmin({ count: 0, list: RECENT_ENTRIES })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await expect(triggerProactiveInsight('user-1')).resolves.toBeUndefined()
    expect(admin.insert).not.toHaveBeenCalled()
  })

  it('skips generation when there are no recent entries', async () => {
    const admin = buildAdmin({ count: 0, list: [] })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await triggerProactiveInsight('user-1')

    expect(mockComplete).not.toHaveBeenCalled()
  })

  it('014: dispara content_opportunity (sem IA) quando a captura recente tem sinal forte', async () => {
    const strongFirst = [
      { id: 's1', what_i_did: 'Lancei o app, 10k downloads no 1º mês', tags: ['lançamento'], impact: 'Crescimento forte', metric: '10k downloads' },
      { id: 'e2', what_i_did: 'Reunião de status', tags: [], impact: null, metric: null },
    ]
    const admin = buildAdmin({ count: 0, list: strongFirst })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await triggerProactiveInsight('user-1')

    expect(mockComplete).not.toHaveBeenCalled()
    expect(admin.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'content_opportunity',
        headline: 'Lancei o app, 10k downloads no 1º mês',
        entry_ids: ['s1'],
      })
    )
  })

  it('014: captura fraca (sem impacto/métrica) cai no insight comum via IA', async () => {
    mockComplete.mockResolvedValue(jsonBlock(VALID_DRAFT))
    const weak = [{ id: 'w1', what_i_did: 'Reunião de status', tags: [], impact: null, metric: null }]
    const admin = buildAdmin({ count: 0, list: weak })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await triggerProactiveInsight('user-1')

    expect(mockComplete).toHaveBeenCalledOnce()
    expect(admin.insert).toHaveBeenCalledWith(expect.objectContaining({ type: 'invisible_skill' }))
  })
})
