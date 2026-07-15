import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockBuildCaptureContext = vi.fn()
const mockCaptureAndReflect = vi.fn()
const mockSaveEntries = vi.fn()
const mockFireAndForget = vi.fn()
const mockExtractTextFromPDF = vi.fn()
const mockExtractFromLinkedIn = vi.fn()
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
      textTooShort: 'Conta um pouco mais, ainda não consegui captar.',
      invalidKind: 'Tipo de captura inválido',
      comingSoon: 'Captura por áudio/imagem chega em breve.',
      invalidFile: 'Arquivo inválido',
      fileTooLarge: 'Arquivo muito grande (máx 10 MB)',
      missingFile: 'Nenhum arquivo enviado',
      generic: 'Não consegui processar sua captura agora, tenta de novo?',
      emptyContent: 'Escreva algo pra registrar.',
    }
    return (key: string) => messages[key] ?? key
  }),
}))

vi.mock('@/lib/ai/extraction/context', () => ({ buildCaptureContext: mockBuildCaptureContext }))
vi.mock('@/lib/ai/extraction/captureAndReflect', () => ({ captureAndReflect: mockCaptureAndReflect }))
vi.mock('@/lib/db/entries', () => ({ saveEntries: mockSaveEntries }))
vi.mock('@/lib/ai/extraction/jobs', () => ({
  triggerProactiveInsight: vi.fn(async () => {}),
  maybeRegenerateMirror: vi.fn(async () => {}),
  triggerEnrichmentNudge: vi.fn(async () => {}),
  triggerOrganizeEntry: vi.fn(async () => {}),
  fireAndForget: mockFireAndForget,
}))
vi.mock('@/lib/pdf/extractText', () => ({ extractTextFromPDF: mockExtractTextFromPDF }))
vi.mock('@/lib/ai/extraction/extractFromLinkedIn', () => ({
  extractFromDocument: mockExtractFromLinkedIn,
  extractFromLinkedIn: mockExtractFromLinkedIn,
}))

const AUTH_USER = { id: 'user-1', email: 'ana@example.com' }

function buildJsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/capture', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/capture — kind: deposito', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
    mockSingle.mockResolvedValue({ data: { id: 'entry-1', title: 'resolvi um bug hoje' }, error: null })
  })

  it('retorna 201 com { id, title } para texto curto, sem chamar nenhuma IA', async () => {
    const { POST } = await import('@/app/api/capture/route')

    const response = await POST(buildJsonRequest({ kind: 'deposito', rawText: 'resolvi um bug hoje' }))
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body).toEqual({ id: 'entry-1', title: 'resolvi um bug hoje' })
    expect(mockCaptureAndReflect).not.toHaveBeenCalled()
    expect(mockBuildCaptureContext).not.toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })

  it('retorna 422 emptyContent para rawText vazio após trim, sem inserir e sem chamar IA', async () => {
    const { POST } = await import('@/app/api/capture/route')

    const response = await POST(buildJsonRequest({ kind: 'deposito', rawText: '   ' }))
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body.error).toBeTruthy()
    expect(mockInsert).not.toHaveBeenCalled()
    expect(mockCaptureAndReflect).not.toHaveBeenCalled()
  })

  it('preserva um texto de milhares de caracteres verbatim no insert (sem truncar)', async () => {
    const longText = `primeira linha do texto\n${'lorem ipsum dolor sit amet '.repeat(200).trimEnd()}`
    mockSingle.mockResolvedValue({ data: { id: 'entry-2', title: 'primeira linha do texto' }, error: null })

    const { POST } = await import('@/app/api/capture/route')
    const response = await POST(buildJsonRequest({ kind: 'deposito', rawText: longText }))

    expect(response.status).toBe(201)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ what_i_did: longText, raw_content: longText, source: 'deposito' })
    )
  })

  it('trunca silenciosamente um rawText acima de 20.000 caracteres (piso técnico, não gate de produto)', async () => {
    const oversizedText = 'a'.repeat(20_500)
    mockSingle.mockResolvedValue({ data: { id: 'entry-3', title: 'aaaa' }, error: null })

    const { POST } = await import('@/app/api/capture/route')
    const response = await POST(buildJsonRequest({ kind: 'deposito', rawText: oversizedText }))

    expect(response.status).toBe(201)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        what_i_did: 'a'.repeat(20_000),
        raw_content: 'a'.repeat(20_000),
      })
    )
  })

  it('retorna 401 sem sessão válida e não insere nada', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const { POST } = await import('@/app/api/capture/route')
    const response = await POST(buildJsonRequest({ kind: 'deposito', rawText: 'texto válido de registro' }))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBeTruthy()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('não altera o comportamento existente de kind=marco', async () => {
    mockSaveEntries.mockResolvedValue([{ id: 'entry-marco' }])

    const { POST } = await import('@/app/api/capture/route')
    const response = await POST(buildJsonRequest({ kind: 'marco', what_i_did: 'fechei um marco' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.entries).toHaveLength(1)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
