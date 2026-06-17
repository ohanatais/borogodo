import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GenerationFailedError } from '@/lib/errors'

const mockGetUser = vi.fn()
vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}))

const mockLoadSeed = vi.fn()
vi.mock('@/lib/ai/content/loadSeed', () => ({
  loadSeedEvidence: (...args: unknown[]) => mockLoadSeed(...args),
}))

const mockGetVoiceProfile = vi.fn()
vi.mock('@/lib/db/drafts', () => ({
  getVoiceProfile: (...args: unknown[]) => mockGetVoiceProfile(...args),
}))

const mockGenerateDraft = vi.fn()
vi.mock('@/lib/ai/content/generateDraft', () => ({
  generateDraft: (...args: unknown[]) => mockGenerateDraft(...args),
}))

vi.mock('@/lib/log', () => ({ logger: { error: vi.fn(), info: vi.fn() } }))

const VARIANTS = [
  { angle: 'o aprendizado', body: 'Corpo um.', evidenceRefs: ['E1'] },
  { angle: 'quem participou', body: 'Corpo dois.', evidenceRefs: ['E2'] },
]

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/content/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { format: 'post', seedType: 'theme', seedRef: 'produto 0→1' }

describe('POST /api/content/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockLoadSeed.mockResolvedValue({ seedSummary: 'produto 0→1', evidence: [{ label: 'E1', text: 'fato' }] })
    mockGetVoiceProfile.mockResolvedValue(null)
    mockGenerateDraft.mockResolvedValue({ variants: VARIANTS })
  })

  it('devolve 200 com 2 variantes quando o motor gera com sucesso', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { variants: unknown[] }
    expect(body.variants).toHaveLength(2)
  })

  it('devolve 401 quando não há sessão', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('../route')
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(401)
  })

  it('devolve 400 quando o payload é inválido', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ seedType: 'theme' }))
    expect(res.status).toBe(400)
  })

  it('devolve 404 quando o seed não é do usuário', async () => {
    mockLoadSeed.mockResolvedValue(null)
    const { POST } = await import('../route')
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(404)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('seed_not_found')
  })

  it('devolve 422 quando o motor falha no ruleset nas duas tentativas', async () => {
    mockGenerateDraft.mockRejectedValue(new GenerationFailedError([2, 6]))
    const { POST } = await import('../route')
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(422)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('generation_failed')
  })

  it('US2: reusa o mesmo motor para resumo de impacto a partir de uma entrada', async () => {
    const { POST } = await import('../route')
    const res = await POST(
      makeRequest({ format: 'impact_summary', seedType: 'entry', seedRef: 'entry-123' })
    )
    expect(res.status).toBe(200)
    expect(mockLoadSeed).toHaveBeenCalledWith(expect.anything(), 'user-1', 'entry', 'entry-123')
    expect(mockGenerateDraft).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'impact_summary' })
    )
  })

  it('US3: aceita e gera mini-bio a partir de um tema (reusa o mesmo motor)', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ format: 'mini_bio', seedType: 'theme', seedRef: 'produto 0→1' }))
    expect(res.status).toBe(200)
    expect(mockGenerateDraft).toHaveBeenCalledWith(expect.objectContaining({ format: 'mini_bio' }))
  })

  it('não chama o motor quando o seed não existe (sem custo de IA)', async () => {
    mockLoadSeed.mockResolvedValue(null)
    const { POST } = await import('../route')
    await POST(makeRequest(VALID_BODY))
    expect(mockGenerateDraft).not.toHaveBeenCalled()
  })

  // T008 — RED (Phase 3 US1): angleKind no schema da rota
  it('US1: passa angleKind study para o motor quando enviado na requisição', async () => {
    const { POST } = await import('../route')
    await POST(makeRequest({ ...VALID_BODY, angleKind: 'study' }))
    expect(mockGenerateDraft).toHaveBeenCalledWith(
      expect.objectContaining({ angleKind: 'study' })
    )
  })

  it('US1: rejeita angleKind inválido com 400', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ ...VALID_BODY, angleKind: 'invalid' }))
    expect(res.status).toBe(400)
  })

  it('US1: passa thesis para o motor quando enviado', async () => {
    const { POST } = await import('../route')
    await POST(makeRequest({ ...VALID_BODY, angleKind: 'study', thesis: 'Retenção é confiança' }))
    expect(mockGenerateDraft).toHaveBeenCalledWith(
      expect.objectContaining({ thesis: 'Retenção é confiança' })
    )
  })

  // T018 — RED (Phase 4 US2): pré-check de lastro + injeção de lastroText
  describe('US2: opinião com lastro', () => {
    it('devolve 400 opinion_needs_lastro quando opinion sem evidência e sem lastroText', async () => {
      mockLoadSeed.mockResolvedValue({ seedSummary: 'produto 0→1', evidence: [] })
      const { POST } = await import('../route')
      const res = await POST(makeRequest({ ...VALID_BODY, angleKind: 'opinion', thesis: 'Retenção é confiança' }))
      expect(res.status).toBe(400)
      const body = (await res.json()) as { error: string }
      expect(body.error).toBe('opinion_needs_lastro')
    })

    it('não chama o motor quando falta lastro (sem custo de IA)', async () => {
      mockLoadSeed.mockResolvedValue({ seedSummary: 'produto 0→1', evidence: [] })
      const { POST } = await import('../route')
      await POST(makeRequest({ ...VALID_BODY, angleKind: 'opinion', thesis: 'Retenção é confiança' }))
      expect(mockGenerateDraft).not.toHaveBeenCalled()
    })

    it('injeta lastroText como { label: "Lastro" } no início da evidência antes do motor', async () => {
      mockLoadSeed.mockResolvedValue({
        seedSummary: 'produto 0→1',
        evidence: [{ label: 'E1', text: 'fato registrado' }],
      })
      const { POST } = await import('../route')
      await POST(
        makeRequest({
          ...VALID_BODY,
          angleKind: 'opinion',
          thesis: 'Retenção é confiança',
          lastroText: 'Conduzi a virada de retenção numa fintech no último ano.',
        })
      )
      expect(mockGenerateDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          evidence: [
            { label: 'Lastro', text: 'Conduzi a virada de retenção numa fintech no último ano.' },
            { label: 'E1', text: 'fato registrado' },
          ],
        })
      )
    })

    it('com lastroText e evidência vazia, gera normalmente (lastro basta como âncora)', async () => {
      mockLoadSeed.mockResolvedValue({ seedSummary: 'produto 0→1', evidence: [] })
      const { POST } = await import('../route')
      const res = await POST(
        makeRequest({
          ...VALID_BODY,
          angleKind: 'opinion',
          thesis: 'Retenção é confiança',
          lastroText: 'Conduzi a virada de retenção numa fintech.',
        })
      )
      expect(res.status).toBe(200)
      expect(mockGenerateDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          evidence: [{ label: 'Lastro', text: 'Conduzi a virada de retenção numa fintech.' }],
        })
      )
    })
  })
})
