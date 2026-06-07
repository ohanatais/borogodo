import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { LogoutButton } from '@/components/features/auth/LogoutButton'

export default async function PainelPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const t = await getTranslations('painel')
  const name = profile?.name ?? user.email ?? ''

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-creme)' }}>
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
      >
        <p
          className="font-semibold"
          style={{ color: 'var(--foreground)' }}
        >
          {t('greeting', { name })}
        </p>
        <LogoutButton />
      </header>

      <section className="flex items-center justify-center px-6 py-24 text-center">
        <p style={{ color: 'var(--muted-foreground)' }}>
          {t('placeholder')}
        </p>
      </section>
    </main>
  )
}
