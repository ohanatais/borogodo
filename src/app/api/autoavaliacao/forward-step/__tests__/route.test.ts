import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ForwardStepFailedError } from '@/lib/ai/content/forwardStep'

const mockGetUser = vi.fn()
vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}))

const mockGetBody = vi.fn()
const mockSaveForwardStep = vi.fn()
vi.mock('@/lib/db/drafts', () => ({
  getSelfAssessmentBody: (...a: unknown[]) => mockGetBody(...a),
  saveForwardStep: (...a: unknown[]) => mockSaveForwardStep(...a),
}))

const mockForwardStep = vi.fn()
vi.mock('@/lib/ai/content/forwardStep', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/content/forwardStep')>()
  return { ...actual, forwardStep: (...a: unknown[]) => mockForwardStep(...a) }
})

vi.mock('@/lib/log', () => ({ logger: { error: vi.fn(), info: vi.fn() } }))

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/autoavaliacao/forward-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { draftId: 'draft-1', kind: 'action_plan' }
const PLAN = { kind: 'action_plan', anchoredOn: ['x'], actionPlan: { area: 'a', experienceAction: 'b', commitmentQuestion: 'c' }, generatedAt: '2026-06-20T00:00:00Z' }

describe('POST /api/autoavaliacao/forward-step', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetBody.mockResolvedValue('Pontos a desenvolver:\nQuero afiar negociação.')
    mockForwardStep.mockResolvedValue(PLAN)
    mockSaveForwardStep.mockResolvedValue(true)
  })

  it('200 com o ForwardStep, persistido em qa.forwardStep do draft do usuário', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { kind: string }
    expect(body.kind).toBe('action_plan')
    // Lê o body escopado por user_id e persiste o passo no draft.
    expect(mockGetBody).toHaveBeenCalledWith(expect.anything(), 'user-1', 'draft-1')
    expect(mockSaveForwardStep).toHaveBeenCalledWith(expect.anything(), 'user-1', 'draft-1', PLAN)
  })

  it('401 sem sessão (auth-first, antes de ler draft ou LLM)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('../route')
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(401)
    expect(mockForwardStep).not.toHaveBeenCalled()
  })

  it('404 draft_not_found quando o draft não é do usuário (body null)', async () => {
    mockGetBody.mockResolvedValue(null)
    const { POST } = await import('../route')
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(404)
    expect(mockForwardStep).not.toHaveBeenCalled()
  })

  it('400 quando kind é inválido (Zod)', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ draftId: 'draft-1', kind: 'inventado' }))
    expect(res.status).toBe(400)
  })

  it('422 generation_failed quando o forwardStep degrada (anti-invenção bloqueante)', async () => {
    mockForwardStep.mockRejectedValue(new ForwardStepFailedError('invention'))
    const { POST } = await import('../route')
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(422)
    expect(mockSaveForwardStep).not.toHaveBeenCalled()
  })
})
