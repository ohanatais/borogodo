'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { CURRENT_TERMS_VERSION } from '@/lib/legal/policy'

type ConsentResult = { success: true } | { success: false; error: string }

/**
 * Grava o aceite dos termos da versão vigente para a conta autenticada.
 *
 * Idempotente: se a conta já estiver na versão vigente, não sobrescreve
 * `terms_accepted_at` (preserva a data original do aceite vigente).
 */
export async function recordTermsAcceptance(): Promise<ConsentResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Não autorizado' }

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('terms_version')
    .eq('id', user.id)
    .single()

  if (fetchError) return { success: false, error: 'Erro ao verificar aceite. Tente de novo.' }

  if (profile?.terms_version === CURRENT_TERMS_VERSION) {
    return { success: true }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      terms_version: CURRENT_TERMS_VERSION,
      terms_accepted_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { success: false, error: 'Erro ao registrar aceite. Tente de novo.' }

  revalidatePath('/', 'layout')
  return { success: true }
}

const MarketingConsentSchema = z.boolean()

/** Grava a preferência de marketing (opt-in explícito, revogável) da conta autenticada. */
export async function setMarketingConsent(optIn: boolean): Promise<ConsentResult> {
  const parsed = MarketingConsentSchema.safeParse(optIn)
  if (!parsed.success) return { success: false, error: 'Valor inválido.' }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Não autorizado' }

  const { error } = await supabase
    .from('profiles')
    .update({ marketing_consent: parsed.data })
    .eq('id', user.id)

  if (error) return { success: false, error: 'Erro ao salvar. Tente de novo.' }

  revalidatePath('/configuracoes')
  return { success: true }
}
