import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { generateAndSaveMirror } from '@/lib/ai/mirror/generateMirror'
import { errorMessage, NoEntriesError } from '@/lib/errors'
import { logger } from '@/lib/log'

const ERROR_MESSAGES = {
  unauthorized: 'Não autorizado',
  noEntries: 'Sem entradas',
  generic: 'Algo deu errado ao gerar seu espelho. Tenta de novo?',
}

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
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

    markOnboardingCompleted(supabase, user.id).catch((err: unknown) => {
      logger.error('markOnboardingCompleted failed', { message: errorMessage(err) })
    })

    return NextResponse.json({ mirror: snapshot.mirror }, { status: 200 })
  } catch (error: unknown) {
    if (error instanceof NoEntriesError) {
      return jsonError(ERROR_MESSAGES.noEntries, 400)
    }

    logger.error('mirror generation failed', { message: errorMessage(error) })
    return jsonError(ERROR_MESSAGES.generic, 500)
  }
}

async function markOnboardingCompleted(
  supabase: SupabaseServerClient,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', userId)

  if (error) {
    throw new Error(`markOnboardingCompleted: ${error.message}`)
  }
}
