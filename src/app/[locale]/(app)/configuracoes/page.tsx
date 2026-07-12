import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { getProfile } from '@/lib/db/profiles'
import { MeusDadosCard } from '@/components/features/perfil/MeusDadosCard'
import { ContactCard } from '@/components/features/support/ContactCard'
import { LegalLinksCard } from '@/components/features/legal/LegalLinksCard'
import { ConfiguracoesTabs } from '@/components/features/perfil/ConfiguracoesTabs'

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
    <div className="max-w-[980px] mx-auto px-6 py-8 pb-32 lg:pb-8">
      <h1
        className="text-2xl font-semibold mb-8"
        style={{ fontFamily: 'Fraunces, serif', color: 'var(--foreground)' }}
      >
        {t('title')}
      </h1>

      <ConfiguracoesTabs
        groupAriaLabel={t('title')}
        meusDadosLabel={t('sections.profile')}
        privacidadeLabel={t('sections.privacy')}
        suporteLabel={t('sections.support')}
        meusDados={<MeusDadosCard profile={profile} />}
        privacidade={
          <LegalLinksCard
            marketingConsent={profile?.marketing_consent ?? false}
            termsVersion={profile?.terms_version ?? null}
            termsAcceptedAt={profile?.terms_accepted_at ?? null}
          />
        }
        suporte={<ContactCard />}
      />
    </div>
  )
}
