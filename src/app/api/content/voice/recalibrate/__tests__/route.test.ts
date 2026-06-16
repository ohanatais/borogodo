import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}))

const mockGetVoiceProfile = vi.fn()
const mockGetVoiceFeedbackData = vi.fn()
const mockUpsertVoiceProfile = vi.fn()
vi.mock('@/lib/db/drafts', () => ({
  getVoiceProfile: (...args: unknown[]) => mockGetVoiceProfile(...args),
  getVoiceFeedbackData: (...args: unknown[]) => mockGetVoiceFeedbackData(...args),
  upsertVoiceProfile: (...args: unknown[]) => mockUpsertVoiceProfile(...args),
}))

const mockRecalibrateVoice = vi.fn()
vi.mock('@/lib/ai/content/recalibrateVoice', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/ai/content/recalibrateVoice')>()
  return {
    ...actual, // mantém shouldSuggestRecalibration e o limiar reais (lógica determinística)
    recalibrateVoice: (...args: unknown[]) => mockRecalibrateVoice(...args),
  }
})

vi.mock('@/lib/log', () => ({ logger: { error: vi.fn(), info: vi.fn() } }))

function makeRequest(body?: unknown): Request {
  return new Request('http://localhost/api/content/voice/recalibrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const SIGNAL_HIGH = { soaCount: 1, naoSoaCount: 4, lastFeedbackAt: '2026-06-10T00:00:00.000Z' }

describe('POST /api/content/voice/recalibrate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetVoiceProfile.mockResolvedValue(null)
    mockGetVoiceFeedbackData.mockResolvedValue({
      signal: SIGNAL_HIGH,
      soa: ['soou bem'],
      naoSoa: ['não soou', 'também não', 'nem esse', 'esse também não'],
    })
    mockRecalibrateVoice.mockResolvedValue({ samples: ['amostra'], inferredSummary: 'voz nova', updatedAt: 'novo' })
    mockUpsertVoiceProfile.mockImplementation(async (_s, _u, profile) => profile)
  })

  it('401 quando não há sessão', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ apply: true }))
    expect(res.status).toBe(401)
    expect(mockRecalibrateVoice).not.toHaveBeenCalled()
  })

  it('modo sugerir (apply ausente): lê o sinal e NÃO muda nada', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { suggest: boolean }
    expect(body.suggest).toBe(true) // 4 "não soa" ≥ limiar, sem voz anterior
    expect(mockRecalibrateVoice).not.toHaveBeenCalled()
    expect(mockUpsertVoiceProfile).not.toHaveBeenCalled()
  })

  it('modo sugerir devolve false abaixo do limiar', async () => {
    mockGetVoiceFeedbackData.mockResolvedValue({
      signal: { soaCount: 0, naoSoaCount: 1, lastFeedbackAt: '2026-06-10T00:00:00.000Z' },
      soa: [],
      naoSoa: ['só um'],
    })
    const { POST } = await import('../route')
    const res = await POST(makeRequest())
    const body = (await res.json()) as { suggest: boolean }
    expect(body.suggest).toBe(false)
  })

  it('modo aplicar (apply: true): recalibra, persiste e devolve a voz nova', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ apply: true }))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { recalibrated: boolean; voiceProfile: { inferredSummary: string } }
    expect(body.recalibrated).toBe(true)
    expect(body.voiceProfile.inferredSummary).toBe('voz nova')
    expect(mockRecalibrateVoice).toHaveBeenCalledWith(
      expect.objectContaining({ naoSoaSamples: expect.arrayContaining(['não soou']) })
    )
    expect(mockUpsertVoiceProfile).toHaveBeenCalled()
  })

  it('aplicar sem sinal nenhum é no-op (não chama o LLM nem persiste)', async () => {
    mockGetVoiceFeedbackData.mockResolvedValue({
      signal: { soaCount: 0, naoSoaCount: 0, lastFeedbackAt: null },
      soa: [],
      naoSoa: [],
    })
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ apply: true }))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { recalibrated: boolean }
    expect(body.recalibrated).toBe(false)
    expect(mockRecalibrateVoice).not.toHaveBeenCalled()
    expect(mockUpsertVoiceProfile).not.toHaveBeenCalled()
  })

  it('500 quando a recalibração lança', async () => {
    mockRecalibrateVoice.mockRejectedValue(new Error('boom'))
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ apply: true }))
    expect(res.status).toBe(500)
  })
})
