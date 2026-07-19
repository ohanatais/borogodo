import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { routing } from '@/i18n/routing'
import { buildCaptureContext } from '@/lib/ai/extraction/context'
import { captureAndReflect } from '@/lib/ai/extraction/captureAndReflect'
import { extractFromDocument } from '@/lib/ai/extraction/extractFromLinkedIn'
import { extractTextFromPDF } from '@/lib/pdf/extractText'
import { saveEntries } from '@/lib/db/entries'
import { saveDeposito, EmptyContentError, type ManualFields } from '@/lib/capture/saveDeposito'
import {
  fireAndForget,
  maybeRegenerateMirror,
  triggerProactiveInsight,
  triggerEnrichmentNudge,
  triggerOrganizeEntry,
} from '@/lib/ai/extraction/jobs'
import { errorMessage, NoExtractableContentError } from '@/lib/errors'
import { logger } from '@/lib/log'

const MIN_TEXT_LENGTH = 3
const MAX_TEXT_LENGTH = 20_000
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>
type ApiErrors = Awaited<ReturnType<typeof getTranslations<'capture.apiErrors'>>>
type Locale = (typeof routing.locales)[number]

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

async function getApiErrors(): Promise<ApiErrors> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale: Locale = routing.locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : routing.defaultLocale

  return getTranslations({ locale, namespace: 'capture.apiErrors' })
}

function readTextInput(formData: FormData, t: ApiErrors): { rawText: string } | { error: NextResponse } {
  const content = formData.get('content')

  if (typeof content !== 'string' || content.trim().length < MIN_TEXT_LENGTH) {
    return { error: jsonError(t('textTooShort'), 400) }
  }

  if (content.trim().length > MAX_TEXT_LENGTH) {
    return { error: jsonError(t('textTooLong'), 400) }
  }

  return { rawText: content.trim() }
}

function readFileInput(formData: FormData, t: ApiErrors): { file: File } | { error: NextResponse } {
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return { error: jsonError(t('missingFile'), 400) }
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    return { error: jsonError(t('invalidFile'), 400) }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: jsonError(t('fileTooLarge'), 400) }
  }

  return { file }
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient()
  const t = await getApiErrors()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonError(t('unauthorized'), 401)
  }

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const body = await request.json() as Record<string, unknown>
    if (body.kind === 'deposito') {
      return handleDepositoCapture(supabase, user.id, body, t)
    }
    return jsonError(t('invalidKind'), 400)
  }

  const formData = await request.formData()
  const kind = formData.get('kind')

  if (kind === 'audio' || kind === 'image' || kind === 'question') {
    return jsonError(t('comingSoon'), 501)
  }

  if (kind === 'file') {
    return handleFileCapture(supabase, user.id, formData, t)
  }

  if (kind !== 'text') {
    return jsonError(t('invalidKind'), 400)
  }

  return handleTextCapture(supabase, user.id, formData, t)
}

function readManualFields(body: Record<string, unknown>): ManualFields | undefined {
  const raw = body.manualFields
  if (!raw || typeof raw !== 'object') return undefined

  const fields = raw as Record<string, unknown>
  return {
    metric: typeof fields.metric === 'string' ? fields.metric : null,
    impact: typeof fields.impact === 'string' ? fields.impact : null,
    tags: Array.isArray(fields.tags) ? fields.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    company: typeof fields.company === 'string' ? fields.company : null,
    entryDate: typeof fields.entryDate === 'string' ? fields.entryDate : null,
  }
}

/**
 * Salvamento direto (025-registro-deposito): nunca chama IA, nunca rejeita por tamanho/formato de
 * texto — o único erro de conteúdo possível é `rawText` vazio (contracts/capture.md).
 */
async function handleDepositoCapture(
  supabase: SupabaseServerClient,
  userId: string,
  body: Record<string, unknown>,
  t: ApiErrors
): Promise<NextResponse> {
  const rawText = typeof body.rawText === 'string' ? body.rawText : ''

  try {
    const result = await saveDeposito(supabase, userId, {
      rawText,
      manualFields: readManualFields(body),
    })
    // US3 (feature 026, FR-009): salvar sem clicar em "Organizar" dispara a organização em
    // segundo plano, fire-and-forget — não bloqueia esta resposta (contracts/organize.md).
    dispatchAsyncJobs(userId, result.id)
    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof EmptyContentError) {
      return jsonError(t('emptyContent'), 422)
    }
    const message = errorMessage(error)
    logger.error('deposito capture failed', { message })
    return jsonError(t('generic'), 500)
  }
}

async function handleTextCapture(
  supabase: SupabaseServerClient,
  userId: string,
  formData: FormData,
  t: ApiErrors
): Promise<NextResponse> {
  const textInput = readTextInput(formData, t)
  if ('error' in textInput) {
    return textInput.error
  }

  try {
    const context = await buildCaptureContext(supabase, userId)
    const { entries, reflection } = await captureAndReflect(textInput.rawText, 'text', context, userId)
    const saved = await saveEntries(supabase, userId, entries)

    dispatchAsyncJobs(userId)

    return NextResponse.json({ entries: saved, reflection }, { status: 200 })
  } catch (error: unknown) {
    if (error instanceof NoExtractableContentError) {
      return jsonError(t('noContent'), 422)
    }
    const message = errorMessage(error)
    logger.error('capture failed', { kind: 'text', message })
    const body = process.env.NODE_ENV === 'development' ? `[dev] ${message}` : t('generic')
    return jsonError(body, 500)
  }
}

async function handleFileCapture(
  supabase: SupabaseServerClient,
  userId: string,
  formData: FormData,
  t: ApiErrors
): Promise<NextResponse> {
  const fileInput = readFileInput(formData, t)
  if ('error' in fileInput) {
    return fileInput.error
  }

  try {
    const buffer = Buffer.from(await fileInput.file.arrayBuffer())
    const pdfText = await extractTextFromPDF(buffer)
    const extracted = await extractFromDocument(pdfText, userId)
    // Registra o arquivo de origem em cada entrada para rastreabilidade no feed.
    const entries = extracted.map((entry) => ({ ...entry, file_name: fileInput.file.name }))
    const saved = await saveEntries(supabase, userId, entries)

    dispatchAsyncJobs(userId)

    return NextResponse.json({ entries: saved, reflection: null }, { status: 200 })
  } catch (error: unknown) {
    const message = errorMessage(error)
    logger.error('capture failed', { kind: 'file', message })
    const body = process.env.NODE_ENV === 'development' ? `[dev] ${message}` : t('generic')
    return jsonError(body, 500)
  }
}

/**
 * `entryId` é opcional (US3, feature 026): só o caminho `deposito` tem uma única fonte recém-
 * salva para organizar em segundo plano — os demais caminhos (texto/arquivo) continuam
 * disparando só os jobs pré-existentes.
 */
function dispatchAsyncJobs(userId: string, entryId?: string): void {
  fireAndForget('triggerProactiveInsight', triggerProactiveInsight(userId))
  fireAndForget('triggerEnrichmentNudge', triggerEnrichmentNudge(userId))
  if (entryId) {
    fireAndForget('triggerOrganizeEntry', triggerOrganizeEntry(userId, entryId))
  } else {
    fireAndForget('maybeRegenerateMirror', maybeRegenerateMirror(userId))
  }
}
