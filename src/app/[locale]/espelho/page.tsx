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

  const snapshot = await getLatestSnapshot(supabase, user.id)
  if (!snapshot) redirect('/painel')

  const t = await getTranslations('painel')

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-creme)' }}>
      <AppHeader greeting={t('greeting', { name: '' })} />
      <MirrorContent snapshot={snapshot} />
    </main>
  )
}
