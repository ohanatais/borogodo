import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockOrganizeEntry = vi.fn()

// `POST /organize` adquire o lock via `tryAcquireOrganizingLock` — um único UPDATE condicional
// (`update().eq().eq().or().select()`), com um SELECT de fallback só quando o UPDATE não casa
// nenhuma linha (achado do code-review high: o padrão antigo de "ler, depois escrever" tinha uma
// corrida real com o disparo assíncrono do salvar, US3 — ver `src/lib/entries/organizingLock.ts`).
let updateMatched = true
let existingRow: { id: string } | null = { id: 'entry-1' }

const mockUpdateSelect = vi.fn(async () => ({ data: updateMatched ? [{ id: 'entry-1' }] : [], error: null }))
const mockUpdateOr = vi.fn(() => ({ select: mockUpdateSelect }))
const mockUpdateEq2 = vi.fn(() => ({ or: mockUpdateOr }))
const mockUpdateEq1 = vi.fn(() => ({ eq: mockUpdateEq2 }))
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq1 }))

const mockMaybeSingle = vi.fn(async () => ({ data: existingRow, error: null }))
const mockSelectEq2 = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelectEq1 = vi.fn(() => ({ eq: mockSelectEq2 }))
const mockSelect = vi.fn(() => ({ eq: mockSelectEq1 }))

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
    updateMatched = true
    existingRow = { id: 'entry-1' }
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
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
    updateMatched = false
    existingRow = null
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

  it('não dispara nova organização quando já está organizando (guarda de concorrência, FR-031) — o UPDATE condicional não casa nenhuma linha', async () => {
    updateMatched = false
    existingRow = { id: 'entry-1' }
    const { POST } = await import('@/app/api/entries/[id]/organize/route')

    const response = await POST(buildRequest(), buildContext())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('already_organizing')
    expect(mockOrganizeEntry).not.toHaveBeenCalled()
  })

  // Nota (code-review high, feature 026): a recência do lock (janela de 60s, FR-031) virou parte
  // da condição `WHERE` do UPDATE atômico em `tryAcquireOrganizingLock` — não é mais algo que a
  // rota lê e decide, então não há comportamento de "timeout expirado" observável neste nível de
  // mock. Esse cálculo (cutoff = now - ORGANIZING_TIMEOUT_MS) é coberto por
  // `src/lib/entries/__tests__/organizingLock.test.ts` (desfechos do UPDATE) e
  // `src/lib/entries/__tests__/organizationStatus.test.ts` (janela de tolerância).
})
