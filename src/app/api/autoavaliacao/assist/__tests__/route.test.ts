import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AssistFailedError } from '@/lib/ai/content/assist'

const mockGetUser = vi.fn()
vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}))

const mockAssist = vi.fn()
vi.mock('@/lib/ai/content/assist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/content/assist')>()
  return { ...actual, assist: (...args: unknown[]) => mockAssist(...args) }
})

vi.mock('@/lib/log', () => ({ logger: { error: vi.fn(), info: vi.fn() } }))

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/autoavaliacao/assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const REPHRASE_BODY = { mode: 'rephrase', section: 'entregas', text: 'liderei o lançamento' }

describe('POST /api/autoavaliacao/assist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockAssist.mockResolvedValue({ mode: 'rephrase', suggestion: 'Liderei o lançamento.' })
  })

  it('200 com a sugestão quando o assist responde', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest(REPHRASE_BODY))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { suggestion: string }
    expect(body.suggestion).toBe('Liderei o lançamento.')
  })

  it('401 sem sessão (auth-first, antes de qualquer LLM)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('../route')
    const res = await POST(makeRequest(REPHRASE_BODY))
    expect(res.status).toBe(401)
    expect(mockAssist).not.toHaveBeenCalled()
  })

  it('400 quando o mode é inválido (Zod no boundary)', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ mode: 'inventar', section: 'entregas', text: 'x' }))
    expect(res.status).toBe(400)
    expect(mockAssist).not.toHaveBeenCalled()
  })

  it('400 quando rephrase vem sem text', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ mode: 'rephrase', section: 'entregas' }))
    expect(res.status).toBe(400)
  })

  it('422 assist_failed quando o assist degrada (não bloqueia a escrita)', async () => {
    mockAssist.mockRejectedValue(new AssistFailedError('ruleset'))
    const { POST } = await import('../route')
    const res = await POST(makeRequest(REPHRASE_BODY))
    expect(res.status).toBe(422)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('assist_failed')
  })

  it('500 em erro inesperado', async () => {
    mockAssist.mockRejectedValue(new Error('boom'))
    const { POST } = await import('../route')
    const res = await POST(makeRequest(REPHRASE_BODY))
    expect(res.status).toBe(500)
  })
})
