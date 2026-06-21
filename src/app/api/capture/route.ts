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
import { fireAndForget, maybeRegenerateMirror, triggerProactiveInsight, triggerEnrichmentNudge } from '@/lib/ai/extraction/jobs'
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
    if (body.kind === 'marco') {
      return handleMarcoCapture(supabase, user.id, body, t)
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

async function handleMarcoCapture(
  supabase: SupabaseServerClient,
  userId: string,
  body: Record<string, unknown>,
  t: ApiErrors
): Promise<NextResponse> {
  const what_i_did = typeof body.what_i_did === 'string' ? body.what_i_did.trim() : ''
  if (!what_i_did) return jsonError(t('textTooShort'), 400)

  const entry = {
    what_i_did,
    company: typeof body.company === 'string' ? body.company : null,
    role_title: typeof body.role_title === 'string' ? body.role_title : null,
    entry_date: typeof body.entry_date === 'string' ? body.entry_date : null,
    impact: typeof body.impact === 'string' ? body.impact : null,
    metric: typeof body.metric === 'string' ? body.metric : null,
    tags: [],
    raw_content: what_i_did,
    source: 'text' as const,
  }

  try {
    const saved = await saveEntries(supabase, userId, [entry])
    dispatchAsyncJobs(userId)
    return NextResponse.json({ entries: saved, reflection: null }, { status: 200 })
  } catch (error: unknown) {
    const message = errorMessage(error)
    logger.error('marco capture failed', { message })
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

  const projectName = formData.get('project_name')
  const overrideProjectName = typeof projectName === 'string' && projectName.trim()
    ? projectName.trim()
    : undefined

  try {
    const context = await buildCaptureContext(supabase, userId)
    const { entries, reflection } = await captureAndReflect(textInput.rawText, 'text', context)
    const entriesWithProject = overrideProjectName
      ? entries.map((e) => ({ ...e, project_name: overrideProjectName }))
      : entries
    const saved = await saveEntries(supabase, userId, entriesWithProject)

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
    const extracted = await extractFromDocument(pdfText)
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

function dispatchAsyncJobs(userId: string): void {
  fireAndForget('triggerProactiveInsight', triggerProactiveInsight(userId))
  fireAndForget('maybeRegenerateMirror', maybeRegenerateMirror(userId))
  fireAndForget('triggerEnrichmentNudge', triggerEnrichmentNudge(userId))
}
