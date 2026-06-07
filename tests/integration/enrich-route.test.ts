import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockEnrichEntryField = vi.fn()

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}))

vi.mock('@/lib/db/entries', () => ({
  enrichEntryField: mockEnrichEntryField,
  ENRICHABLE_FIELDS: ['metric', 'impact', 'decision', 'learning'],
}))

const AUTH_USER = { id: 'user-1', email: 'ana@example.com' }

const ENTRY = {
  id: 'entry-1',
  user_id: 'user-1',
  what_i_did: 'Fechei a migração do banco no prazo',
  decision: null,
  learning: null,
  impact: null,
  metric: 'Reduziu o tempo de deploy em 40%',
  entry_date: null,
  tags: ['migração'],
  source: 'text',
  raw_content: 'Fechei a migração do banco no prazo',
  created_at: '2026-06-07T10:00:00.000Z',
  updated_at: '2026-06-07T10:05:00.000Z',
}

function buildRequest(body: unknown): Request {
  return new Request('http://localhost/api/entries/entry-1/enrich', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function buildContext(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

describe('PATCH /api/entries/:id/enrich', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
    mockEnrichEntryField.mockResolvedValue(ENTRY)
  })

  it('retorna 200 e atualiza o campo quando field e answer são válidos', async () => {
    const { PATCH } = await import('../../src/app/api/entries/[id]/enrich/route')

    const response = await PATCH(
      buildRequest({ field: 'metric', answer: 'Reduziu o tempo de deploy em 40%' }),
      buildContext('entry-1')
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.entry.id).toBe('entry-1')
    expect(body.entry.metric).toBe('Reduziu o tempo de deploy em 40%')
    expect(mockEnrichEntryField).toHaveBeenCalledWith(
      expect.anything(),
      'entry-1',
      'metric',
      'Reduziu o tempo de deploy em 40%'
    )
  })

  it('retorna 400 quando field está fora do conjunto fechado', async () => {
    const { PATCH } = await import('../../src/app/api/entries/[id]/enrich/route')

    const response = await PATCH(
      buildRequest({ field: 'titulo', answer: 'qualquer coisa' }),
      buildContext('entry-1')
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBeTruthy()
    expect(mockEnrichEntryField).not.toHaveBeenCalled()
  })

  it('retorna 400 quando answer está vazio', async () => {
    const { PATCH } = await import('../../src/app/api/entries/[id]/enrich/route')

    const response = await PATCH(buildRequest({ field: 'metric', answer: '   ' }), buildContext('entry-1'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBeTruthy()
    expect(mockEnrichEntryField).not.toHaveBeenCalled()
  })

  it('retorna 401 sem sessão válida e não chama enrichEntryField', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const { PATCH } = await import('../../src/app/api/entries/[id]/enrich/route')
    const response = await PATCH(buildRequest({ field: 'metric', answer: 'qualquer coisa' }), buildContext('entry-1'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBeTruthy()
    expect(mockEnrichEntryField).not.toHaveBeenCalled()
  })

  it('retorna 404 quando a entrada não existe ou pertence a outro usuário (RLS)', async () => {
    mockEnrichEntryField.mockResolvedValue(null)

    const { PATCH } = await import('../../src/app/api/entries/[id]/enrich/route')
    const response = await PATCH(
      buildRequest({ field: 'metric', answer: 'Reduziu o tempo de deploy em 40%' }),
      buildContext('entry-de-outro-usuario')
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toBeTruthy()
  })
})
