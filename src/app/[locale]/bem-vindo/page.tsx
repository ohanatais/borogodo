import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase/server'
import { getProfile } from '@/lib/db/profiles'
import { OnboardingShell } from '@/components/features/onboarding/OnboardingShell'

export default async function BemVindoPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(supabase, user.id)
  if (profile?.onboarding_completed) redirect('/espelho')

  return <OnboardingShell userName={profile?.name ?? ''} />
}
