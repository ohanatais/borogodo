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
import { fireAndForget, maybeRegenerateMirror, triggerProactiveInsight } from '@/lib/ai/extraction/jobs'
import { errorMessage } from '@/lib/errors'
import { logger } from '@/lib/log'

const MIN_TEXT_LENGTH = 3
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
    const { entries, reflection } = await captureAndReflect(textInput.rawText, 'text', context)
    const saved = await saveEntries(supabase, userId, entries)

    dispatchAsyncJobs(userId)

    return NextResponse.json({ entries: saved, reflection }, { status: 200 })
  } catch (error: unknown) {
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
    const entries = await extractFromDocument(pdfText)
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
}
