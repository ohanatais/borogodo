import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { getLatestSnapshot } from '@/lib/db/mirror'
import { AppHeader } from '@/components/layout/AppHeader'
import { MirrorContent } from '@/components/features/espelho/MirrorContent'

export default async function EspelhoPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [snapshot, profileRes] = await Promise.all([
    getLatestSnapshot(supabase, user.id),
    supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
  ])

  if (!snapshot) redirect('/painel')

  const t = await getTranslations('painel')
  const profileName = (profileRes.data as { name?: string | null } | null)?.name ?? ''

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-creme)' }}>
      <AppHeader greeting={t('greeting', { name: profileName })} />
      <MirrorContent snapshot={snapshot} userName={profileName} />
    </main>
  )
}
