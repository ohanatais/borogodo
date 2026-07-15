import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { generateAndSaveMirror } from '@/lib/ai/mirror/generateMirror'
import { errorMessage, NoEntriesError } from '@/lib/errors'
import { aiLimitResponse } from '@/lib/ai/cost/limitResponse'
import { logger } from '@/lib/log'
import { recordTermsAcceptance, setMarketingConsent } from '@/lib/actions/consent'
import type { User } from '@supabase/supabase-js'

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
    const isFirstGeneration = !(await isOnboardingCompleted(supabase, user.id))

    const snapshot = await generateAndSaveMirror(supabase, user.id)

    markOnboardingCompleted(supabase, user.id).catch((err: unknown) => {
      logger.error('markOnboardingCompleted failed', { message: errorMessage(err) })
    })

    // Só na chamada que conclui o onboarding — em regenerações seguintes (correção, botão
    // "gerar de novo"), recordConsent() reescreveria marketing_consent com o valor estático do
    // metadata do cadastro, apagando qualquer mudança que o usuário tenha feito depois em
    // /configuracoes (viola "revogável a qualquer momento", FR do data-model.md).
    if (isFirstGeneration) {
      recordConsent(user).catch((err: unknown) => {
        logger.error('recordConsent failed', { message: errorMessage(err) })
      })
    }

    return NextResponse.json({ mirror: snapshot.mirror }, { status: 200 })
  } catch (error: unknown) {
    const limited = aiLimitResponse(error)
    if (limited) return limited

    if (error instanceof NoEntriesError) {
      return jsonError(ERROR_MESSAGES.noEntries, 400)
    }

    logger.error('mirror generation failed', { message: errorMessage(error) })
    return jsonError(ERROR_MESSAGES.generic, 500)
  }
}

async function isOnboardingCompleted(
  supabase: SupabaseServerClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .maybeSingle()

  return Boolean((data as { onboarding_completed?: boolean } | null)?.onboarding_completed)
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

/**
 * Carimba o aceite dos termos ao concluir o onboarding (feature 024, US2) — silencioso, sem
 * clique extra, pois o usuário já consentiu via aviso sign-in-wrap no cadastro. Também persiste,
 * se presente, o `marketing_consent` capturado no metadata do cadastro por e-mail (US4) — o
 * caminho Google nunca tem esse campo, então nada é gravado (permanece `false` por padrão).
 */
async function recordConsent(user: User): Promise<void> {
  const termsResult = await recordTermsAcceptance()
  if (!termsResult.success) {
    throw new Error(`recordTermsAcceptance: ${termsResult.error}`)
  }

  const marketingConsent = user.user_metadata?.marketing_consent
  if (typeof marketingConsent !== 'boolean') return

  const marketingResult = await setMarketingConsent(marketingConsent)
  if (!marketingResult.success) {
    throw new Error(`setMarketingConsent: ${marketingResult.error}`)
  }
}
