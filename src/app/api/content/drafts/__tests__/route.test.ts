import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}))

const mockInsertDraft = vi.fn()
const mockUpdateDraft = vi.fn()
const mockListDrafts = vi.fn()
const mockDeleteDraft = vi.fn()
vi.mock('@/lib/db/drafts', () => ({
  insertDraft: (...args: unknown[]) => mockInsertDraft(...args),
  updateDraft: (...args: unknown[]) => mockUpdateDraft(...args),
  listDrafts: (...args: unknown[]) => mockListDrafts(...args),
  deleteDraft: (...args: unknown[]) => mockDeleteDraft(...args),
}))

vi.mock('@/lib/log', () => ({ logger: { error: vi.fn(), info: vi.fn() } }))

const SAVED_DRAFT = {
  id: 'draft-1',
  format: 'post',
  seedType: 'theme',
  seedRef: 'produto 0→1',
  angle: 'o aprendizado',
  body: 'Corpo persistido.',
  status: 'generated',
  voiceFeedback: null,
  createdAt: '2026-06-15T12:00:00Z',
}

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/content/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function patchRequest(body: unknown): Request {
  return new Request('http://localhost/api/content/drafts/draft-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function getRequest(query = ''): Request {
  return new Request(`http://localhost/api/content/drafts${query}`, { method: 'GET' })
}

function deleteRequest(): Request {
  return new Request('http://localhost/api/content/drafts/draft-1', { method: 'DELETE' })
}

const VALID_CREATE = {
  format: 'post',
  seedType: 'theme',
  seedRef: 'produto 0→1',
  angle: 'o aprendizado',
  body: 'Corpo persistido.',
  status: 'generated',
  qa: { angle: 'o aprendizado', evidenceRefs: ['E1'] },
}

describe('POST /api/content/drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockInsertDraft.mockResolvedValue(SAVED_DRAFT)
  })

  it('persiste e devolve 201 com o draft escopado ao usuário da sessão', async () => {
    const { POST } = await import('../route')
    const res = await POST(postRequest(VALID_CREATE))
    expect(res.status).toBe(201)
    const body = (await res.json()) as { draft: { id: string } }
    expect(body.draft.id).toBe('draft-1')
    expect(mockInsertDraft).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      expect.objectContaining({ format: 'post', status: 'generated' })
    )
  })

  it('devolve 401 quando não há sessão', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('../route')
    const res = await POST(postRequest(VALID_CREATE))
    expect(res.status).toBe(401)
    expect(mockInsertDraft).not.toHaveBeenCalled()
  })

  it('devolve 400 quando o status pedido não é generated/edited', async () => {
    const { POST } = await import('../route')
    const res = await POST(postRequest({ ...VALID_CREATE, status: 'copied' }))
    expect(res.status).toBe(400)
  })

  it('devolve 400 quando o body está vazio', async () => {
    const { POST } = await import('../route')
    const res = await POST(postRequest({ ...VALID_CREATE, body: '' }))
    expect(res.status).toBe(400)
  })

  it('devolve 500 quando o insert falha', async () => {
    mockInsertDraft.mockRejectedValue(new Error('db down'))
    const { POST } = await import('../route')
    const res = await POST(postRequest(VALID_CREATE))
    expect(res.status).toBe(500)
  })
})

describe('PATCH /api/content/drafts/[id]', () => {
  const params = Promise.resolve({ id: 'draft-1' })

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockUpdateDraft.mockResolvedValue({ ...SAVED_DRAFT, status: 'copied' })
  })

  it('atualiza e devolve 200 com o draft do próprio usuário', async () => {
    const { PATCH } = await import('../[id]/route')
    const res = await PATCH(patchRequest({ status: 'copied' }), { params })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { draft: { status: string } }
    expect(body.draft.status).toBe('copied')
  })

  it('salva o feedback de voz sem regerar (PATCH só toca no banco)', async () => {
    mockUpdateDraft.mockResolvedValue({ ...SAVED_DRAFT, voiceFeedback: 'nao_soa' })
    const { PATCH } = await import('../[id]/route')
    const res = await PATCH(patchRequest({ voiceFeedback: 'nao_soa' }), { params })
    expect(res.status).toBe(200)
    expect(mockUpdateDraft).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'draft-1',
      expect.objectContaining({ voiceFeedback: 'nao_soa' })
    )
  })

  it('devolve 404 (não 403) para id de outro usuário', async () => {
    mockUpdateDraft.mockResolvedValue(null)
    const { PATCH } = await import('../[id]/route')
    const res = await PATCH(patchRequest({ status: 'copied' }), { params })
    expect(res.status).toBe(404)
  })

  it('devolve 400 quando o patch está vazio', async () => {
    const { PATCH } = await import('../[id]/route')
    const res = await PATCH(patchRequest({}), { params })
    expect(res.status).toBe(400)
    expect(mockUpdateDraft).not.toHaveBeenCalled()
  })

  it('devolve 401 quando não há sessão', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { PATCH } = await import('../[id]/route')
    const res = await PATCH(patchRequest({ status: 'copied' }), { params })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/content/drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockListDrafts.mockResolvedValue({ items: [SAVED_DRAFT], nextCursor: null })
  })

  it('devolve 200 com a página de rascunhos do usuário da sessão', async () => {
    const { GET } = await import('../route')
    const res = await GET(getRequest())
    expect(res.status).toBe(200)
    const body = (await res.json()) as { items: { id: string }[]; nextCursor: string | null }
    expect(body.items[0].id).toBe('draft-1')
    expect(body.nextCursor).toBeNull()
    expect(mockListDrafts).toHaveBeenCalledWith(expect.anything(), 'user-1', expect.any(Object))
  })

  it('repassa cursor, limit e status para listDrafts', async () => {
    const { GET } = await import('../route')
    await GET(getRequest('?cursor=2026-06-15T12:00:00Z&limit=10&status=arquivados'))
    expect(mockListDrafts).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      expect.objectContaining({ cursor: '2026-06-15T12:00:00Z', limit: 10, status: 'arquivados' })
    )
  })

  it('devolve 400 quando o status é inválido', async () => {
    const { GET } = await import('../route')
    const res = await GET(getRequest('?status=tudo'))
    expect(res.status).toBe(400)
    expect(mockListDrafts).not.toHaveBeenCalled()
  })

  it('devolve 400 quando o limit excede o teto', async () => {
    const { GET } = await import('../route')
    const res = await GET(getRequest('?limit=50'))
    expect(res.status).toBe(400)
  })

  it('devolve 401 quando não há sessão', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { GET } = await import('../route')
    const res = await GET(getRequest())
    expect(res.status).toBe(401)
    expect(mockListDrafts).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/content/drafts/[id]', () => {
  const params = Promise.resolve({ id: 'draft-1' })

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockDeleteDraft.mockResolvedValue(true)
  })

  it('exclui e devolve 204 sem corpo, escopado ao usuário da sessão', async () => {
    const { DELETE } = await import('../[id]/route')
    const res = await DELETE(deleteRequest(), { params })
    expect(res.status).toBe(204)
    expect(mockDeleteDraft).toHaveBeenCalledWith(expect.anything(), 'user-1', 'draft-1')
  })

  it('devolve 204 mesmo quando nada foi apagado (id alheio — não confirma existência)', async () => {
    mockDeleteDraft.mockResolvedValue(false)
    const { DELETE } = await import('../[id]/route')
    const res = await DELETE(deleteRequest(), { params })
    expect(res.status).toBe(204)
  })

  it('devolve 401 quando não há sessão', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { DELETE } = await import('../[id]/route')
    const res = await DELETE(deleteRequest(), { params })
    expect(res.status).toBe(401)
    expect(mockDeleteDraft).not.toHaveBeenCalled()
  })
})
