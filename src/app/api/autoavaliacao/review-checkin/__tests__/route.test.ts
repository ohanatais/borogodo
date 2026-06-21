import { describe, it, expect, vi, beforeEach } from 'vitest'
import { advanceReviewAnchor } from '@/lib/autoavaliacao/reviewCheckIn'

const mockGetUser = vi.fn()
const mockMaybeSingle = vi.fn()
const mockUpdateEq = vi.fn()
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))
const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })) })),
  update: mockUpdate,
}))
vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: mockFrom })),
}))

const mockBuildContext = vi.fn()
vi.mock('@/lib/ai/extraction/context', () => ({ buildCaptureContext: (...a: unknown[]) => mockBuildContext(...a) }))

const mockCaptureAndReflect = vi.fn()
vi.mock('@/lib/ai/extraction/captureAndReflect', () => ({ captureAndReflect: (...a: unknown[]) => mockCaptureAndReflect(...a) }))

const mockSaveEntries = vi.fn()
vi.mock('@/lib/db/entries', () => ({ saveEntries: (...a: unknown[]) => mockSaveEntries(...a) }))

const mockFireAndForget = vi.fn()
vi.mock('@/lib/ai/extraction/jobs', () => ({
  fireAndForget: (...a: unknown[]) => mockFireAndForget(...a),
  maybeRegenerateMirror: vi.fn(),
  triggerProactiveInsight: vi.fn(),
  triggerEnrichmentNudge: vi.fn(),
}))

vi.mock('@/lib/log', () => ({ logger: { error: vi.fn(), info: vi.fn() } }))

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/autoavaliacao/review-checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID = { text: 'Consegui mentorar a Marina e ela assumiu o onboarding do time.' }

describe('POST /api/autoavaliacao/review-checkin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockMaybeSingle.mockResolvedValue({ data: { review_cycle_months: 3, review_cycle_anchor: '2026-03-01' } })
    mockUpdateEq.mockResolvedValue({ error: null })
    mockBuildContext.mockResolvedValue({ ctx: true })
    mockCaptureAndReflect.mockResolvedValue({ entries: [{ what_i_did: 'mentorou' }], reflection: { headline: 'oi' } })
    mockSaveEntries.mockResolvedValue([{ id: 'e1', what_i_did: 'mentorou' }])
  })

  it('200: a resposta vira registro (pipeline de captura) e a âncora avança para o próximo ciclo', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest(VALID))
    expect(res.status).toBe(200)

    // Reusa o pipeline de captura: extrai e persiste como entry do próprio usuário.
    expect(mockCaptureAndReflect).toHaveBeenCalledWith(VALID.text, 'text', { ctx: true })
    expect(mockSaveEntries).toHaveBeenCalledWith(expect.anything(), 'user-1', [{ what_i_did: 'mentorou' }])

    // Fecha o loop: âncora avança (sem coluna nova), some o re-nag.
    const expectedAnchor = advanceReviewAnchor('2026-03-01', 3, new Date())
    expect(mockUpdate).toHaveBeenCalledWith({ review_cycle_anchor: expectedAnchor })

    // Reaproveita os jobs assíncronos da captura (regenera espelho/insight).
    expect(mockFireAndForget).toHaveBeenCalled()
  })

  it('401 sem sessão (auth-first, antes de qualquer LLM)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('../route')
    const res = await POST(makeRequest(VALID))
    expect(res.status).toBe(401)
    expect(mockCaptureAndReflect).not.toHaveBeenCalled()
  })

  it('400 quando o texto é vazio/curto demais (Zod no boundary)', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ text: '  ' }))
    expect(res.status).toBe(400)
    expect(mockCaptureAndReflect).not.toHaveBeenCalled()
  })

  it('sem recorrência definida: registra mas não toca na âncora', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { review_cycle_months: null, review_cycle_anchor: null } })
    const { POST } = await import('../route')
    const res = await POST(makeRequest(VALID))
    expect(res.status).toBe(200)
    expect(mockSaveEntries).toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
