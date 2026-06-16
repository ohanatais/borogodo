import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase/server'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profileRes = await supabase
    .from('profiles')
    .select('name, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  const profileData = profileRes.data as { name?: string | null; onboarding_completed?: boolean } | null
  if (!profileData?.onboarding_completed) redirect('/bem-vindo')

  const name = profileData?.name ?? ''

  return (
    <AppShell userName={name}>
      {children}
    </AppShell>
  )
}
