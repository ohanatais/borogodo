import { describe, it, expect, vi, beforeEach } from 'vitest'

// T043 (US4, feature 026) — POST cria destaque em branco (position = último + 1); GET lista;
// PATCH edita só o destaque alvo; DELETE remove só o destaque alvo — nunca a fonte nem os demais
// destaques (FR-015/FR-016).

const mockGetUser = vi.fn()

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/entries/rollupEntryTags', () => ({ rollupEntryTags: mockRollupEntryTags }))

const { mockFrom, mockRollupEntryTags } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRollupEntryTags: vi.fn(),
}))

const AUTH_USER = { id: 'user-1', email: 'ana@example.com' }

function buildContext(id = 'entry-1') {
  return { params: Promise.resolve({ id }) }
}

function buildHighlightContext(id = 'entry-1', highlightId = 'highlight-1') {
  return { params: Promise.resolve({ id, highlightId }) }
}

function buildRequest(method: string, url: string, body?: Record<string, unknown>): Request {
  return new Request(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('POST /api/entries/[id]/highlights (T043)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
  })

  it('401 sem auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const { POST } = await import('@/app/api/entries/[id]/highlights/route')

    const response = await POST(buildRequest('POST', 'http://localhost/api/entries/entry-1/highlights'), buildContext())

    expect(response.status).toBe(401)
  })

  it('404 quando a fonte não existe/não pertence ao usuário', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'entries') {
        return {
          select: vi.fn(function (this: unknown) { return this }),
          eq: vi.fn(function (this: unknown) { return this }),
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })
    const { POST } = await import('@/app/api/entries/[id]/highlights/route')

    const response = await POST(buildRequest('POST', 'http://localhost/api/entries/entry-1/highlights'), buildContext())

    expect(response.status).toBe(404)
  })

  it('cria destaque em branco com position = último + 1', async () => {
    const insertedRows: Record<string, unknown>[] = []
    mockFrom.mockImplementation((table: string) => {
      if (table === 'entries') {
        return {
          select: vi.fn(function (this: unknown) { return this }),
          eq: vi.fn(function (this: unknown) { return this }),
          maybeSingle: vi.fn(async () => ({ data: { id: 'entry-1' }, error: null })),
        }
      }
      if (table === 'entry_highlights') {
        return {
          select: vi.fn(function (this: unknown) { return this }),
          eq: vi.fn(function (this: unknown) { return this }),
          order: vi.fn(function (this: unknown) { return this }),
          limit: vi.fn(async () => ({ data: [{ position: 2 }], error: null })),
          insert: vi.fn((row: Record<string, unknown>) => {
            insertedRows.push(row)
            return {
              select: vi.fn(function (this: unknown) { return this }),
              maybeSingle: vi.fn(async () => ({ data: { id: 'h-new', ...row }, error: null })),
            }
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })
    const { POST } = await import('@/app/api/entries/[id]/highlights/route')

    const response = await POST(buildRequest('POST', 'http://localhost/api/entries/entry-1/highlights'), buildContext())
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(insertedRows[0]).toMatchObject({ entry_id: 'entry-1', user_id: 'user-1', position: 3, title: null, tags: [] })
    expect(body.highlight).toMatchObject({ id: 'h-new' })
  })

  it('position = 0 quando é o primeiro destaque da fonte', async () => {
    const insertedRows: Record<string, unknown>[] = []
    mockFrom.mockImplementation((table: string) => {
      if (table === 'entries') {
        return {
          select: vi.fn(function (this: unknown) { return this }),
          eq: vi.fn(function (this: unknown) { return this }),
          maybeSingle: vi.fn(async () => ({ data: { id: 'entry-1' }, error: null })),
        }
      }
      if (table === 'entry_highlights') {
        return {
          select: vi.fn(function (this: unknown) { return this }),
          eq: vi.fn(function (this: unknown) { return this }),
          order: vi.fn(function (this: unknown) { return this }),
          limit: vi.fn(async () => ({ data: [], error: null })),
          insert: vi.fn((row: Record<string, unknown>) => {
            insertedRows.push(row)
            return {
              select: vi.fn(function (this: unknown) { return this }),
              maybeSingle: vi.fn(async () => ({ data: { id: 'h-new', ...row }, error: null })),
            }
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })
    const { POST } = await import('@/app/api/entries/[id]/highlights/route')

    await POST(buildRequest('POST', 'http://localhost/api/entries/entry-1/highlights'), buildContext())

    expect(insertedRows[0]).toMatchObject({ position: 0 })
  })
})

describe('GET /api/entries/[id]/highlights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
  })

  it('401 sem auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const { GET } = await import('@/app/api/entries/[id]/highlights/route')

    const response = await GET(buildRequest('GET', 'http://localhost/api/entries/entry-1/highlights'), buildContext())

    expect(response.status).toBe(401)
  })

  it('lista os destaques ordenados por position', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'entries') {
        return {
          select: vi.fn(function (this: unknown) { return this }),
          eq: vi.fn(function (this: unknown) { return this }),
          maybeSingle: vi.fn(async () => ({ data: { id: 'entry-1' }, error: null })),
        }
      }
      if (table === 'entry_highlights') {
        return {
          select: vi.fn(function (this: unknown) { return this }),
          eq: vi.fn(function (this: unknown) { return this }),
          order: vi.fn(async () => ({ data: [{ id: 'h1', position: 0 }, { id: 'h2', position: 1 }], error: null })),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })
    const { GET } = await import('@/app/api/entries/[id]/highlights/route')

    const response = await GET(buildRequest('GET', 'http://localhost/api/entries/entry-1/highlights'), buildContext())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.highlights).toHaveLength(2)
  })
})

describe('PATCH /api/entries/[id]/highlights/[highlightId] (T043)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
  })

  it('401 sem auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const { PATCH } = await import('@/app/api/entries/[id]/highlights/[highlightId]/route')

    const response = await PATCH(
      buildRequest('PATCH', 'http://localhost/x', { title: 'Novo título' }),
      buildHighlightContext()
    )

    expect(response.status).toBe(401)
  })

  it('edita campos do destaque alvo sem afetar os demais (isolamento por linha, FR-015)', async () => {
    const updateCalls: Record<string, unknown>[] = []
    mockFrom.mockImplementation((table: string) => {
      if (table === 'entry_highlights') {
        return {
          update: vi.fn((payload: Record<string, unknown>) => {
            updateCalls.push(payload)
            return {
              eq: vi.fn(function (this: unknown) { return this }),
              select: vi.fn(function (this: unknown) { return this }),
              maybeSingle: vi.fn(async () => ({ data: { id: 'highlight-1', entry_id: 'entry-1', ...payload }, error: null })),
            }
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })
    const { PATCH } = await import('@/app/api/entries/[id]/highlights/[highlightId]/route')

    const response = await PATCH(
      buildRequest('PATCH', 'http://localhost/x', { title: 'Título editado', metric: '10%' }),
      buildHighlightContext()
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(updateCalls[0]).toMatchObject({ title: 'Título editado', metric: '10%' })
    expect(body.highlight).toMatchObject({ id: 'highlight-1' })
    expect(mockRollupEntryTags).not.toHaveBeenCalled()
  })

  it('recalcula o rollup de tags quando tags muda', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'entry_highlights') {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(function (this: unknown) { return this }),
            select: vi.fn(function (this: unknown) { return this }),
            maybeSingle: vi.fn(async () => ({ data: { id: 'highlight-1', entry_id: 'entry-1', tags: ['nova-tag'] }, error: null })),
          })),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })
    mockRollupEntryTags.mockResolvedValue(['nova-tag'])
    const { PATCH } = await import('@/app/api/entries/[id]/highlights/[highlightId]/route')

    const response = await PATCH(
      buildRequest('PATCH', 'http://localhost/x', { tags: ['nova-tag'] }),
      buildHighlightContext()
    )

    expect(response.status).toBe(200)
    expect(mockRollupEntryTags).toHaveBeenCalledWith(expect.anything(), 'entry-1')
  })

  it('404 quando o destaque não existe/não pertence ao usuário ou à fonte', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'entry_highlights') {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(function (this: unknown) { return this }),
            select: vi.fn(function (this: unknown) { return this }),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })
    const { PATCH } = await import('@/app/api/entries/[id]/highlights/[highlightId]/route')

    const response = await PATCH(
      buildRequest('PATCH', 'http://localhost/x', { title: 'x' }),
      buildHighlightContext()
    )

    expect(response.status).toBe(404)
  })

  it('400 quando nenhum campo é enviado', async () => {
    const { PATCH } = await import('@/app/api/entries/[id]/highlights/[highlightId]/route')

    const response = await PATCH(buildRequest('PATCH', 'http://localhost/x', {}), buildHighlightContext())

    expect(response.status).toBe(400)
  })
})

describe('DELETE /api/entries/[id]/highlights/[highlightId] (T043)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
  })

  it('401 sem auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const { DELETE } = await import('@/app/api/entries/[id]/highlights/[highlightId]/route')

    const response = await DELETE(buildRequest('DELETE', 'http://localhost/x'), buildHighlightContext())

    expect(response.status).toBe(401)
  })

  function makeDeleteBuilder(result: { error: unknown; count: number | null }) {
    const builder = {
      eq: vi.fn(() => builder),
      then: (resolve: (value: typeof result) => unknown) => resolve(result),
    }
    return builder
  }

  it('remove só o destaque alvo e recalcula o rollup — nunca remove a fonte', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'entry_highlights') {
        return { delete: vi.fn(() => makeDeleteBuilder({ error: null, count: 1 })) }
      }
      throw new Error(`unexpected table ${table}`)
    })
    const { DELETE } = await import('@/app/api/entries/[id]/highlights/[highlightId]/route')

    const response = await DELETE(buildRequest('DELETE', 'http://localhost/x'), buildHighlightContext())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(mockRollupEntryTags).toHaveBeenCalledWith(expect.anything(), 'entry-1')
    // `entries` nunca é tocada por este endpoint — a exclusão de um destaque nunca apaga a fonte.
    const entriesCalls = mockFrom.mock.calls.filter(([table]) => table === 'entries')
    expect(entriesCalls).toEqual([])
  })

  it('404 quando o destaque não existe/não pertence ao usuário', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'entry_highlights') {
        return { delete: vi.fn(() => makeDeleteBuilder({ error: null, count: 0 })) }
      }
      throw new Error(`unexpected table ${table}`)
    })
    const { DELETE } = await import('@/app/api/entries/[id]/highlights/[highlightId]/route')

    const response = await DELETE(buildRequest('DELETE', 'http://localhost/x'), buildHighlightContext())

    expect(response.status).toBe(404)
    expect(mockRollupEntryTags).not.toHaveBeenCalled()
  })
})
