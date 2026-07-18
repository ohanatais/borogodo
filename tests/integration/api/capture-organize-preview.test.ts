import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockPreviewOrganize = vi.fn()

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock('@/lib/entries/previewOrganize', () => ({ previewOrganize: mockPreviewOrganize }))

const AUTH_USER = { id: 'user-1', email: 'ana@example.com' }

function buildRequest(body: unknown): Request {
  return new Request('http://localhost/api/capture/organize-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/capture/organize-preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
    mockPreviewOrganize.mockResolvedValue({
      status: 'organized',
      result: { highlights: [{ title: 'x', metric: null, impact: null, tags: [] }], company: null, entry_date: null },
    })
  })

  it('retorna 401 sem sessão válida', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const { POST } = await import('@/app/api/capture/organize-preview/route')

    const response = await POST(buildRequest({ rawText: 'texto' }))

    expect(response.status).toBe(401)
    expect(mockPreviewOrganize).not.toHaveBeenCalled()
  })

  it('retorna 400 quando rawText está ausente/vazio', async () => {
    const { POST } = await import('@/app/api/capture/organize-preview/route')

    const response = await POST(buildRequest({ rawText: '' }))

    expect(response.status).toBe(400)
    expect(mockPreviewOrganize).not.toHaveBeenCalled()
  })

  it('retorna 200 com highlights/company/entry_date no sucesso', async () => {
    const { POST } = await import('@/app/api/capture/organize-preview/route')

    const response = await POST(buildRequest({ rawText: 'fiz o discovery e o cliente aceitou' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      status: 'organized',
      highlights: [{ title: 'x', metric: null, impact: null, tags: [] }],
      company: null,
      entry_date: null,
    })
    expect(mockPreviewOrganize).toHaveBeenCalledWith(expect.anything(), 'user-1', {
      rawText: 'fiz o discovery e o cliente aceitou',
      company: null,
      isPersonalProject: false,
      entryDate: null,
    })
  })

  it('repassa company/isPersonalProject/entryDate já resolvidos, sem inferir por cima (FR-004/FR-006)', async () => {
    const { POST } = await import('@/app/api/capture/organize-preview/route')

    await POST(buildRequest({ rawText: 'texto', company: 'Acme', isPersonalProject: false, entryDate: '2026-01-01' }))

    expect(mockPreviewOrganize).toHaveBeenCalledWith(expect.anything(), 'user-1', {
      rawText: 'texto',
      company: 'Acme',
      isPersonalProject: false,
      entryDate: '2026-01-01',
    })
  })

  it('retorna 200 { status: "failed" } quando a extração falha — nunca 5xx só por falha de IA (FR-030)', async () => {
    mockPreviewOrganize.mockResolvedValue({ status: 'failed' })
    const { POST } = await import('@/app/api/capture/organize-preview/route')

    const response = await POST(buildRequest({ rawText: 'texto' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ status: 'failed' })
  })
})
