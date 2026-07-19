import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFireAndForget = vi.fn()
const mockTriggerOrganizeEntry = vi.fn()
const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
const mockFrom = vi.fn(() => ({ insert: mockInsert }))

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], get: () => undefined, set: vi.fn() })),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => {
    const messages: Record<string, string> = {
      unauthorized: 'Não autorizado',
      emptyContent: 'Escreva algo pra registrar.',
      generic: 'Não consegui processar sua captura agora, tenta de novo?',
    }
    return (key: string) => messages[key] ?? key
  }),
}))

vi.mock('@/lib/ai/extraction/context', () => ({ buildCaptureContext: vi.fn() }))
vi.mock('@/lib/ai/extraction/captureAndReflect', () => ({ captureAndReflect: vi.fn() }))
vi.mock('@/lib/db/entries', () => ({ saveEntries: vi.fn() }))
vi.mock('@/lib/ai/extraction/jobs', () => ({
  triggerProactiveInsight: vi.fn(async () => {}),
  maybeRegenerateMirror: vi.fn(async () => {}),
  triggerEnrichmentNudge: vi.fn(async () => {}),
  triggerOrganizeEntry: mockTriggerOrganizeEntry,
  refreshEntryEmbedding: vi.fn(async () => {}),
  fireAndForget: mockFireAndForget,
}))
vi.mock('@/lib/pdf/extractText', () => ({ extractTextFromPDF: vi.fn() }))
vi.mock('@/lib/ai/extraction/extractFromLinkedIn', () => ({ extractFromDocument: vi.fn(), extractFromLinkedIn: vi.fn() }))

const AUTH_USER = { id: 'user-1', email: 'ana@example.com' }

function buildJsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/capture', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/capture — kind: deposito dispara organização assíncrona (US3, feature 026)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
    mockSingle.mockResolvedValue({ data: { id: 'entry-1', title: 'resolvi um bug hoje' }, error: null })
  })

  it('T034 — dispara triggerOrganizeEntry via fireAndForget, sem bloquear a resposta de salvar (FR-009)', async () => {
    let resolveOrganize: () => void = () => {}
    const organizePromise = new Promise<void>((resolve) => {
      resolveOrganize = resolve
    })
    mockTriggerOrganizeEntry.mockReturnValue(organizePromise)

    const { POST } = await import('@/app/api/capture/route')
    const response = await POST(buildJsonRequest({ kind: 'deposito', rawText: 'resolvi um bug hoje' }))
    const body = await response.json()

    // A resposta de salvar já voltou (201) mesmo com a promise de organização ainda pendente —
    // fireAndForget nunca é `await`ado no caminho crítico.
    expect(response.status).toBe(201)
    expect(body).toEqual({ id: 'entry-1', title: 'resolvi um bug hoje' })
    expect(mockTriggerOrganizeEntry).toHaveBeenCalledWith('user-1', 'entry-1')
    expect(mockFireAndForget).toHaveBeenCalledWith('triggerOrganizeEntry', organizePromise)

    resolveOrganize()
    await organizePromise
  })

  it('T035/FR-030 — falha na organização assíncrona não afeta a entry salva (segue 201, sem estado de erro bloqueante)', async () => {
    const failingOrganize = Promise.reject(new Error('falha de IA'))
    failingOrganize.catch(() => {}) // evita unhandled rejection no teste — o próprio código real usa fireAndForget para isso
    mockTriggerOrganizeEntry.mockReturnValue(failingOrganize)
    // fireAndForget real logaria e engoliria o erro — a rota nunca espera essa promise, então uma
    // falha assíncrona não deve derrubar a resposta de salvar.
    mockFireAndForget.mockImplementation((_job: string, promise: Promise<void>) => {
      promise.catch(() => {})
    })

    const { POST } = await import('@/app/api/capture/route')
    const response = await POST(buildJsonRequest({ kind: 'deposito', rawText: 'resolvi um bug hoje' }))
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body).toEqual({ id: 'entry-1', title: 'resolvi um bug hoje' })
  })
})
