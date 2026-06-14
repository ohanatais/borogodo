import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { getLatestSnapshot } from '@/lib/db/mirror'
import { MirrorContent } from '@/components/features/espelho/MirrorContent'

export default async function EspelhoPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [snapshot, profileRes, t] = await Promise.all([
    getLatestSnapshot(supabase, user.id),
    supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
    getTranslations('espelho'),
  ])

  const profileName = (profileRes.data as { name?: string | null } | null)?.name ?? ''

  if (!snapshot) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-8"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          aria-hidden="true"
        >
          {(profileName || '?').charAt(0).toUpperCase()}
        </div>
        <h1
          className="text-2xl font-semibold mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {t('empty.title')}
        </h1>
        <p className="text-base" style={{ color: 'var(--muted-foreground)' }}>
          {t('empty.description')}
        </p>
      </div>
    )
  }

  return (
    <div>
      <MirrorContent snapshot={snapshot} userName={profileName} />
    </div>
  )
}
