import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetUser, mockGenerateAndSaveMirror, mockUpdate, mockEq, mockFrom, mockMaybeSingle } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockGenerateAndSaveMirror: vi.fn(),
  mockUpdate: vi.fn(),
  mockEq: vi.fn(),
  mockFrom: vi.fn(),
  mockMaybeSingle: vi.fn(),
}))

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}))

vi.mock('@/lib/ai/mirror/generateMirror', () => ({
  generateAndSaveMirror: mockGenerateAndSaveMirror,
}))

import { POST } from '@/app/api/mirror/generate/route'
import { NoEntriesError } from '@/lib/errors'

const AUTH_USER = { id: 'user-1', email: 'ana@example.com' }

const MIRROR = {
  intro: 'Já consigo ver algumas coisas, Ana.',
  primary_strength: { headline: 'Síntese para stakeholders', evidence: 'Aparece em 4 entradas.' },
  invisible_skill: { headline: 'Estabiliza o time', evidence: 'Em 3 entradas.' },
  context_pattern: { headline: 'Brilha em 0→1', evidence: 'Sem processo definido.' },
  closing: 'Isso ressoa com você?',
  strength_themes: ['decisão sob pressão', 'síntese para stakeholders', '0→1'],
}

describe('POST /api/mirror/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
    mockGenerateAndSaveMirror.mockResolvedValue({ id: 'snap-1', mirror: MIRROR, entry_count: 5 })

    mockEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockMaybeSingle.mockResolvedValue({ data: { onboarding_completed: false } })
    mockFrom.mockReturnValue({
      update: mockUpdate,
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })) })),
    })
  })

  it('retorna 401 sem sessão', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const response = await POST()

    expect(response.status).toBe(401)
    expect(mockGenerateAndSaveMirror).not.toHaveBeenCalled()
  })

  it('200: gera, persiste e marca onboarding_completed', async () => {
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.mirror).toEqual(MIRROR)
    expect(mockGenerateAndSaveMirror).toHaveBeenCalledWith(expect.anything(), 'user-1')
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true })
    expect(mockEq).toHaveBeenCalledWith('id', 'user-1')
  })

  it('400: sem entradas (NoEntriesError tipado, sem acoplar string)', async () => {
    mockGenerateAndSaveMirror.mockRejectedValue(new NoEntriesError())

    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Sem entradas')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('500: Sonnet retorna JSON inválido / falha de validação — nada persistido', async () => {
    mockGenerateAndSaveMirror.mockRejectedValue(new Error('JSON não encontrado na resposta do modelo'))

    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe('Algo deu errado ao gerar seu espelho. Tenta de novo?')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('200: espelho retornado mesmo quando marcar onboarding falha (fire-and-forget)', async () => {
    mockEq.mockResolvedValue({ error: { message: 'rls denied' } })

    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.mirror).toEqual(MIRROR)
    expect(mockGenerateAndSaveMirror).toHaveBeenCalled()
  })
})
