import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockMaybeSingle = vi.fn()

function makeUpdateBuilder() {
  const builder = {
    eq: vi.fn(() => builder),
    select: vi.fn(() => builder),
    maybeSingle: mockMaybeSingle,
  }
  return builder
}

const mockUpdate = vi.fn(() => makeUpdateBuilder())
const mockFrom = vi.fn(() => ({ update: mockUpdate }))

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

const AUTH_USER = { id: 'user-1', email: 'ana@example.com' }

function buildRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/entries/entry-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function buildContext(id = 'entry-1') {
  return { params: Promise.resolve({ id }) }
}

describe('PATCH /api/entries/[id] — is_personal_project (US2, FR-003/FR-004)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
    mockMaybeSingle.mockResolvedValue({
      data: { id: 'entry-1', company: null, is_personal_project: true },
      error: null,
    })
  })

  it('T027 — aceita is_personal_project (boolean) no body e persiste', async () => {
    const { PATCH } = await import('@/app/api/entries/[id]/route')

    const response = await PATCH(buildRequest({ is_personal_project: true }), buildContext())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ is_personal_project: true }))
  })

  it('T027 — aceita company junto de is_personal_project: false (pílula de empresa)', async () => {
    const { PATCH } = await import('@/app/api/entries/[id]/route')

    const response = await PATCH(
      buildRequest({ company: 'Acme Corp', is_personal_project: false }),
      buildContext()
    )

    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ company: 'Acme Corp', is_personal_project: false })
    )
  })

  it('rejeita is_personal_project com tipo inválido', async () => {
    const { PATCH } = await import('@/app/api/entries/[id]/route')

    const response = await PATCH(buildRequest({ is_personal_project: 'sim' }), buildContext())

    expect(response.status).toBe(400)
  })
})

describe('organizeEntry não sobrescreve contexto resolvido manualmente via pílula (FR-004)', () => {
  it('quando is_personal_project=true, o prompt não pede inferência de empresa e nenhuma company é persistida mesmo se a IA devolver uma', async () => {
    vi.resetModules()
    const mockComplete = vi.fn().mockResolvedValue(
      '```json\n' +
        JSON.stringify({
          highlights: [{ title: 't', metric: null, impact: null, tags: [] }],
          company: 'Empresa que a IA inventou',
          entry_date: null,
        }) +
        '\n```'
    )
    vi.doMock('@/lib/ai/client', () => ({ complete: mockComplete }))
    vi.doMock('@/lib/entries/highlightVocabulary', () => ({ getTagVocabulary: vi.fn().mockResolvedValue([]) }))
    vi.doMock('@/lib/entries/rollupEntryTags', () => ({ rollupEntryTags: vi.fn().mockResolvedValue([]) }))

    const entryRow = {
      id: 'entry-1',
      user_id: 'user-1',
      raw_content: 'Fiz um projeto pessoal de estudo de SQL.',
      company: null,
      entry_date: null,
      is_personal_project: true,
    }

    const updateCalls: Record<string, unknown>[] = []
    let entriesCallCount = 0
    let highlightsCallCount = 0

    const from = vi.fn((table: string) => {
      if (table === 'entries') {
        entriesCallCount += 1
        if (entriesCallCount === 1) {
          return {
            select: vi.fn(function (this: unknown) { return this }),
            eq: vi.fn(function (this: unknown) { return this }),
            maybeSingle: vi.fn(async () => ({ data: entryRow, error: null })),
          }
        }
        return {
          update: vi.fn((payload: Record<string, unknown>) => {
            updateCalls.push(payload)
            return {
              eq: vi.fn(function (this: unknown) { return this }),
              then: (resolve: (v: { data: null; error: null }) => unknown) => resolve({ data: null, error: null }),
            }
          }),
        }
      }
      if (table === 'entry_highlights') {
        highlightsCallCount += 1
        if (highlightsCallCount === 1) {
          return {
            select: vi.fn(function (this: unknown) { return this }),
            eq: vi.fn(function (this: unknown) { return this }),
            order: vi.fn(function (this: unknown) { return this }),
            then: (resolve: (v: { data: never[]; error: null }) => unknown) => resolve({ data: [], error: null }),
          }
        }
        return {
          insert: vi.fn(function (this: unknown) { return this }),
          select: vi.fn(async () => ({ data: [{ id: 'h1' }], error: null })),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })

    const { organizeEntry } = await import('@/lib/entries/organizeEntry')
    const result = await organizeEntry({ from } as never, 'user-1', 'entry-1')

    expect(result.status).toBe('organized')
    const companyUpdate = updateCalls.find((c) => 'company' in c)
    expect(companyUpdate).toBeUndefined()

    const promptSent = mockComplete.mock.calls[0]?.[0]?.user as string
    expect(promptSent).toContain('Projeto pessoal')
    expect(promptSent).toContain('NÃO infira, devolva "company": null')
  })
})
