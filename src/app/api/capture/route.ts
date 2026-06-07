import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { buildCaptureContext } from '@/lib/ai/extraction/context'
import { captureAndReflect } from '@/lib/ai/extraction/captureAndReflect'
import { extractFromLinkedIn } from '@/lib/ai/extraction/extractFromLinkedIn'
import { extractTextFromPDF } from '@/lib/pdf/extractText'
import { saveEntries } from '@/lib/db/entries'
import { fireAndForget, maybeRegenerateMirror, triggerProactiveInsight } from '@/lib/ai/extraction/jobs'
import { logger } from '@/lib/log'

const MIN_TEXT_LENGTH = 3
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

const ERROR_MESSAGES = {
  unauthorized: 'Não autorizado',
  textTooShort: 'Conta um pouco mais, ainda não consegui captar.',
  invalidKind: 'Tipo de captura inválido',
  comingSoon: 'Captura por áudio/imagem chega em breve.',
  invalidFile: 'Arquivo inválido',
  fileTooLarge: 'Arquivo muito grande (máx 10 MB)',
  missingFile: 'Nenhum arquivo enviado',
  generic: 'Não consegui processar sua captura agora, tenta de novo?',
}

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

function readTextInput(formData: FormData): { rawText: string } | { error: NextResponse } {
  const content = formData.get('content')

  if (typeof content !== 'string' || content.trim().length < MIN_TEXT_LENGTH) {
    return { error: jsonError(ERROR_MESSAGES.textTooShort, 400) }
  }

  return { rawText: content.trim() }
}

function readFileInput(formData: FormData): { file: File } | { error: NextResponse } {
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return { error: jsonError(ERROR_MESSAGES.missingFile, 400) }
  }

  if (file.type !== 'application/pdf') {
    return { error: jsonError(ERROR_MESSAGES.invalidFile, 400) }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: jsonError(ERROR_MESSAGES.fileTooLarge, 400) }
  }

  return { file }
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonError(ERROR_MESSAGES.unauthorized, 401)
  }

  const formData = await request.formData()
  const kind = formData.get('kind')

  if (kind === 'audio' || kind === 'image') {
    return jsonError(ERROR_MESSAGES.comingSoon, 501)
  }

  if (kind === 'file') {
    return handleFileCapture(supabase, user.id, formData)
  }

  if (kind !== 'text') {
    return jsonError(ERROR_MESSAGES.invalidKind, 400)
  }

  return handleTextCapture(supabase, user.id, formData)
}

async function handleTextCapture(supabase: SupabaseServerClient, userId: string, formData: FormData): Promise<NextResponse> {
  const textInput = readTextInput(formData)
  if ('error' in textInput) {
    return textInput.error
  }

  try {
    const context = await buildCaptureContext(supabase, userId)
    const { entries, reflection } = await captureAndReflect(textInput.rawText, 'text', context)
    const saved = await saveEntries(supabase, userId, entries)

    dispatchAsyncJobs(userId, saved.length)

    return NextResponse.json({ entries: saved, reflection }, { status: 200 })
  } catch (error: unknown) {
    logger.error('capture failed', { kind: 'text', message: errorMessage(error) })
    return jsonError(ERROR_MESSAGES.generic, 500)
  }
}

async function handleFileCapture(supabase: SupabaseServerClient, userId: string, formData: FormData): Promise<NextResponse> {
  const fileInput = readFileInput(formData)
  if ('error' in fileInput) {
    return fileInput.error
  }

  try {
    const buffer = Buffer.from(await fileInput.file.arrayBuffer())
    const pdfText = await extractTextFromPDF(buffer)
    const entries = await extractFromLinkedIn(pdfText)
    const saved = await saveEntries(supabase, userId, entries)

    dispatchAsyncJobs(userId, saved.length)

    return NextResponse.json({ entries: saved, reflection: null }, { status: 200 })
  } catch (error: unknown) {
    logger.error('capture failed', { kind: 'file', message: errorMessage(error) })
    return jsonError(ERROR_MESSAGES.generic, 500)
  }
}

function dispatchAsyncJobs(userId: string, totalEntries: number): void {
  fireAndForget('triggerProactiveInsight', triggerProactiveInsight(userId))
  fireAndForget('maybeRegenerateMirror', maybeRegenerateMirror(userId, totalEntries))
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error'
}
