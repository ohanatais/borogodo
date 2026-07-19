import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockBuildCaptureContext = vi.fn()
const mockCaptureAndReflect = vi.fn()
const mockSaveEntries = vi.fn()
const mockFireAndForget = vi.fn()
const mockExtractTextFromPDF = vi.fn()
const mockExtractFromLinkedIn = vi.fn()

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
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
    }
    return (key: string) => messages[key] ?? key
  }),
}))

vi.mock('@/lib/ai/extraction/context', () => ({
  buildCaptureContext: mockBuildCaptureContext,
}))

vi.mock('@/lib/ai/extraction/captureAndReflect', () => ({
  captureAndReflect: mockCaptureAndReflect,
}))

vi.mock('@/lib/db/entries', () => ({
  saveEntries: mockSaveEntries,
}))

vi.mock('@/lib/ai/extraction/jobs', () => ({
  triggerProactiveInsight: vi.fn(async () => {}),
  maybeRegenerateMirror: vi.fn(async () => {}),
  triggerEnrichmentNudge: vi.fn(async () => {}),
  refreshEntryEmbedding: vi.fn(async () => {}),
  fireAndForget: mockFireAndForget,
}))

vi.mock('@/lib/pdf/extractText', () => ({
  extractTextFromPDF: mockExtractTextFromPDF,
}))

vi.mock('@/lib/ai/extraction/extractFromLinkedIn', () => ({
  extractFromDocument: mockExtractFromLinkedIn,
  extractFromLinkedIn: mockExtractFromLinkedIn,
}))

const AUTH_USER = { id: 'user-1', email: 'ana@example.com' }

const REFLECTION = {
  summary: 'Entendi: você fechou a migração sob pressão.',
  pills: ['decisão sob pressão'],
  move: { type: 'affirmation', text: 'Isso é material de entrevista.' },
}

const SAVED_ENTRY = {
  id: 'entry-1',
  user_id: 'user-1',
  what_i_did: 'Fechei a migração do banco no prazo',
  decision: null,
  learning: null,
  impact: null,
  metric: null,
  entry_date: null,
  tags: ['migração'],
  source: 'text',
  raw_content: 'Fechei a migração do banco no prazo',
  created_at: '2026-06-07T10:00:00.000Z',
  updated_at: '2026-06-07T10:00:00.000Z',
}

function buildRequest(formFields: Record<string, string>): Request {
  const formData = new FormData()
  for (const [key, value] of Object.entries(formFields)) {
    formData.append(key, value)
  }

  return new Request('http://localhost/api/capture', { method: 'POST', body: formData })
}

/**
 * jsdom's `File`/`Blob` não passam no brand-check do undici ao rodar `new Request(...).formData()`
 * (ver discussões em vitest-environment-jsdom). A rota só chama `request.formData()`, então
 * simulamos isso diretamente — evita o round-trip problemático sem perder cobertura da rota.
 */
function buildFileRequest(file: File): Request {
  const formData = new FormData()
  formData.append('kind', 'file')
  formData.append('file', file)

  return { formData: async () => formData, headers: new Headers() } as unknown as Request
}

function buildPDFFile(name: string, sizeInBytes: number): File {
  return new File([new Uint8Array(sizeInBytes)], name, { type: 'application/pdf' })
}

const EXTRACTED_FILE_ENTRY = {
  what_i_did: 'Liderou o time de pagamentos por 2 anos',
  decision: null,
  learning: null,
  impact: 'Aumentou a conversão em 15%',
  metric: null,
  entry_date: null,
  tags: ['liderança'],
  raw_content: 'texto extraído do PDF',
  source: 'linkedin_pdf',
}

describe('POST /api/capture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
    mockBuildCaptureContext.mockResolvedValue({ strengthThemes: [], recentSummaries: [], entryCount: 0 })
    mockCaptureAndReflect.mockResolvedValue({
      entries: [
        {
          what_i_did: 'Fechei a migração do banco no prazo',
          decision: null,
          learning: null,
          impact: null,
          metric: null,
          entry_date: null,
          tags: ['migração'],
          raw_content: 'Fechei a migração do banco no prazo',
          source: 'text',
        },
      ],
      reflection: REFLECTION,
    })
    mockSaveEntries.mockResolvedValue([SAVED_ENTRY])
    mockExtractTextFromPDF.mockResolvedValue('texto extraído do PDF')
    mockExtractFromLinkedIn.mockResolvedValue([EXTRACTED_FILE_ENTRY])
  })

  it('retorna 200 com entries + reflection e salva a entrada', async () => {
    const { POST } = await import('../../src/app/api/capture/route')

    const response = await POST(
      buildRequest({ kind: 'text', content: 'Fechei a migração do banco no prazo, foi tenso mas deu certo' })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.entries).toHaveLength(1)
    expect(body.entries[0].id).toBe('entry-1')
    expect(body.reflection).toEqual(REFLECTION)
    expect(mockSaveEntries).toHaveBeenCalledWith(expect.anything(), 'user-1', expect.any(Array))
  })

  it('retorna 400 para texto com menos de 3 caracteres, antes de chamar IA', async () => {
    const { POST } = await import('../../src/app/api/capture/route')

    const response = await POST(buildRequest({ kind: 'text', content: 'ok' }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBeTruthy()
    expect(mockCaptureAndReflect).not.toHaveBeenCalled()
    expect(mockSaveEntries).not.toHaveBeenCalled()
  })

  it('retorna 401 sem sessão válida e não persiste nada', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const { POST } = await import('../../src/app/api/capture/route')
    const response = await POST(buildRequest({ kind: 'text', content: 'texto válido de captura' }))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBeTruthy()
    expect(mockSaveEntries).not.toHaveBeenCalled()
  })

  it('retorna 501 para kind=audio (costura, ainda não implementado)', async () => {
    const { POST } = await import('../../src/app/api/capture/route')

    const response = await POST(buildRequest({ kind: 'audio' }))

    expect(response.status).toBe(501)
    expect(mockSaveEntries).not.toHaveBeenCalled()
  })

  it('retorna 501 para kind=image (costura, ainda não implementado)', async () => {
    const { POST } = await import('../../src/app/api/capture/route')

    const response = await POST(buildRequest({ kind: 'image' }))

    expect(response.status).toBe(501)
    expect(mockSaveEntries).not.toHaveBeenCalled()
  })

  it('retorna 500 e não persiste nada quando a saída do modelo falha na validação Zod', async () => {
    mockCaptureAndReflect.mockRejectedValue(new Error('JSON inválido'))

    const { POST } = await import('../../src/app/api/capture/route')
    const response = await POST(buildRequest({ kind: 'text', content: 'texto válido de captura' }))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBeTruthy()
    expect(mockSaveEntries).not.toHaveBeenCalled()
  })

  it('kind=file com PDF válido extrai texto, gera entradas e salva (sem reflexo)', async () => {
    const { POST } = await import('../../src/app/api/capture/route')

    const response = await POST(buildFileRequest(buildPDFFile('curriculo.pdf', 1024)))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockExtractTextFromPDF).toHaveBeenCalled()
    expect(mockExtractFromLinkedIn).toHaveBeenCalledWith('texto extraído do PDF', 'user-1')
    // O nome do arquivo de origem é gravado em cada entrada (issue #42).
    expect(mockSaveEntries).toHaveBeenCalledWith(expect.anything(), 'user-1', [
      { ...EXTRACTED_FILE_ENTRY, file_name: 'curriculo.pdf' },
    ])
    expect(body.entries).toHaveLength(1)
    expect(body.reflection).toBeNull()
  })

  it('kind=file rejeita arquivo que não é PDF', async () => {
    const { POST } = await import('../../src/app/api/capture/route')
    const file = new File([new Uint8Array(1024)], 'curriculo.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    const response = await POST(buildFileRequest(file))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBeTruthy()
    expect(mockExtractTextFromPDF).not.toHaveBeenCalled()
  })

  it('kind=file rejeita PDF acima de 10 MB', async () => {
    const { POST } = await import('../../src/app/api/capture/route')
    const oversized = buildPDFFile('curriculo.pdf', 10 * 1024 * 1024 + 1)

    const response = await POST(buildFileRequest(oversized))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('máx 10 MB')
    expect(mockExtractTextFromPDF).not.toHaveBeenCalled()
  })
})
