import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { generateAndSaveMirror } from '@/lib/ai/mirror/generateMirror'
import { logger } from '@/lib/log'

const ERROR_MESSAGES = {
  unauthorized: 'Não autorizado',
  noEntries: 'Sem entradas',
  generic: 'Algo deu errado ao gerar seu espelho. Tenta de novo?',
}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error'
}

export async function POST(): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonError(ERROR_MESSAGES.unauthorized, 401)
  }

  try {
    const snapshot = await generateAndSaveMirror(supabase, user.id)
    await markOnboardingCompleted(supabase, user.id)

    return NextResponse.json({ mirror: snapshot.mirror }, { status: 200 })
  } catch (error: unknown) {
    const message = errorMessage(error)

    if (message === 'Sem entradas') {
      return jsonError(ERROR_MESSAGES.noEntries, 400)
    }

    logger.error('mirror generation failed', { message })
    return jsonError(ERROR_MESSAGES.generic, 500)
  }
}

async function markOnboardingCompleted(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', userId)

  if (error) {
    logger.error('failed to mark onboarding completed', { message: error.message })
  }
}
