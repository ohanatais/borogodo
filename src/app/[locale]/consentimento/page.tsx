import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase/server'
import { getProfile } from '@/lib/db/profiles'
import { ConsentGate } from '@/components/features/legal/ConsentGate'
import { needsTermsAcceptance } from '@/lib/legal/policy'

/**
 * Tela de re-consentimento (feature 024, US3) — fora do grupo `(app)` de propósito, para não
 * recursar no gate de `(app)/layout.tsx` que redireciona pra cá.
 */
export default async function ConsentimentoPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(supabase, user.id)

  if (!needsTermsAcceptance(profile?.terms_version ?? null)) redirect('/painel')

  return <ConsentGate hasAcceptedBefore={profile?.terms_version != null} />
}
