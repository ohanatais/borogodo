import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockOrganizeEntry = vi.fn()

const mockMaybeSingle = vi.fn()
const mockEqSelect2 = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockEqSelect1 = vi.fn(() => ({ eq: mockEqSelect2 }))
const mockSelect = vi.fn(() => ({ eq: mockEqSelect1 }))

const mockUpdateEq2 = vi.fn(async () => ({ data: null, error: null }))
const mockUpdateEq1 = vi.fn(() => ({ eq: mockUpdateEq2 }))
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq1 }))

const mockFrom = vi.fn(() => ({ select: mockSelect, update: mockUpdate }))

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/entries/organizeEntry', () => ({ organizeEntry: mockOrganizeEntry }))

const AUTH_USER = { id: 'user-1', email: 'ana@example.com' }

function buildRequest(): Request {
  return new Request('http://localhost/api/entries/entry-1/organize', { method: 'POST' })
}

function buildContext(id = 'entry-1') {
  return { params: Promise.resolve({ id }) }
}

describe('POST /api/entries/[id]/organize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
    mockMaybeSingle.mockResolvedValue({ data: { organizing_started_at: null }, error: null })
    mockOrganizeEntry.mockResolvedValue({
      status: 'organized',
      highlights: [{ id: 'h1' }],
      company: null,
      is_personal_project: false,
      entry_date: null,
    })
  })

  it('retorna 401 sem sessão válida', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const { POST } = await import('@/app/api/entries/[id]/organize/route')

    const response = await POST(buildRequest(), buildContext())

    expect(response.status).toBe(401)
    expect(mockOrganizeEntry).not.toHaveBeenCalled()
  })

  it('retorna 404 quando a fonte não existe/não pertence ao usuário', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const { POST } = await import('@/app/api/entries/[id]/organize/route')

    const response = await POST(buildRequest(), buildContext('entry-de-outro-usuario'))

    expect(response.status).toBe(404)
    expect(mockOrganizeEntry).not.toHaveBeenCalled()
  })

  it('retorna 200 com highlights no sucesso', async () => {
    const { POST } = await import('@/app/api/entries/[id]/organize/route')

    const response = await POST(buildRequest(), buildContext())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('organized')
    expect(body.highlights).toEqual([{ id: 'h1' }])
    expect(mockOrganizeEntry).toHaveBeenCalledWith(expect.anything(), 'user-1', 'entry-1')
  })

  it('retorna 200 { status: "failed" } quando a organização falha — nunca 5xx só por falha de IA (FR-030)', async () => {
    mockOrganizeEntry.mockResolvedValue({ status: 'failed' })
    const { POST } = await import('@/app/api/entries/[id]/organize/route')

    const response = await POST(buildRequest(), buildContext())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('failed')
  })

  it('não dispara nova organização quando já está organizando (guarda de concorrência, FR-031)', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { organizing_started_at: new Date().toISOString() },
      error: null,
    })
    const { POST } = await import('@/app/api/entries/[id]/organize/route')

    const response = await POST(buildRequest(), buildContext())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('already_organizing')
    expect(mockOrganizeEntry).not.toHaveBeenCalled()
  })

  it('dispara nova organização quando organizing_started_at está travado (recente demais no passado, timeout expirado)', async () => {
    const staleStartedAt = new Date(Date.now() - 5 * 60_000).toISOString() // 5 min atrás, além do timeout de 60s
    mockMaybeSingle.mockResolvedValue({ data: { organizing_started_at: staleStartedAt }, error: null })
    const { POST } = await import('@/app/api/entries/[id]/organize/route')

    const response = await POST(buildRequest(), buildContext())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('organized')
    expect(mockOrganizeEntry).toHaveBeenCalled()
  })
})
