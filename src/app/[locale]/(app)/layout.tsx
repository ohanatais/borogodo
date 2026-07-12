import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { needsTermsAcceptance } from '@/lib/legal/policy'

type GateProfile = {
  name?: string | null
  onboarding_completed?: boolean
  terms_version?: string | null
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
    return null
  }

  const profileRes = await supabase
    .from('profiles')
    .select('name, onboarding_completed, terms_version')
    .eq('id', user.id)
    .maybeSingle()

  const profileData = profileRes.data as GateProfile | null

  if (!profileData?.onboarding_completed) {
    redirect('/bem-vindo')
    return null
  }

  if (needsTermsAcceptance(profileData.terms_version ?? null)) {
    redirect('/consentimento')
    return null
  }

  const name = profileData?.name ?? ''

  return (
    <AppShell userName={name}>
      {children}
    </AppShell>
  )
}
