import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { getProfile } from '@/lib/db/profiles'
import { IdentityCard } from '@/components/features/perfil/IdentityCard'
import { LinksCard } from '@/components/features/perfil/LinksCard'

export default async function ConfiguracoesPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profile, t] = await Promise.all([
    getProfile(supabase, user.id),
    getTranslations('configuracoes'),
  ])

  return (
    <div className="max-w-[640px] mx-auto px-6 py-8 space-y-6">
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: 'Fraunces, serif', color: 'var(--foreground)' }}
      >
        {t('title')}
      </h1>
      <IdentityCard profile={profile} />
      <LinksCard profile={profile} />
    </div>
  )
}
