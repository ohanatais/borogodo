import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { getLatestSnapshot } from '@/lib/db/mirror'
import { getHistoricoData } from '@/lib/historico/getHistoricoData'
import { MirrorContent } from '@/components/features/espelho/MirrorContent'
import { EspelhoViews } from '@/components/features/espelho/EspelhoViews'
import { parseVista, type EspelhoVista } from '@/components/features/espelho/vista'
import { HistoricoPageClient } from '@/app/[locale]/(app)/historico/HistoricoPageClient'
import type { SupabaseClient } from '@supabase/supabase-js'

interface EspelhoPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EspelhoPage({ searchParams }: EspelhoPageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { vista: vistaParam } = await searchParams
  const vista = parseVista(vistaParam)

  // Busca condicional (FR-010): só a vista ativa consulta o banco.
  const content =
    vista === 'trajetoria'
      ? await renderTrajetoria(supabase, user.id)
      : await renderForcas(supabase, user.id)

  return (
    <div className="px-5 lg:px-9 pt-6 pb-24 max-w-[980px] mx-auto w-full">
      <div className="mb-6">
        <EspelhoViews vista={vista as EspelhoVista} />
      </div>
      {content}
    </div>
  )
}

async function renderForcas(supabase: SupabaseClient, userId: string) {
  const [snapshot, profileRes, t] = await Promise.all([
    getLatestSnapshot(supabase, userId),
    supabase.from('profiles').select('name, avatar_url').eq('id', userId).maybeSingle(),
    getTranslations('espelho'),
  ])

  const profile = profileRes.data as { name?: string | null; avatar_url?: string | null } | null
  const profileName = profile?.name ?? ''
  const avatarUrl = profile?.avatar_url ?? null

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

  return <MirrorContent snapshot={snapshot} userName={profileName} avatarUrl={avatarUrl} />
}

async function renderTrajetoria(supabase: SupabaseClient, userId: string) {
  const data = await getHistoricoData(supabase, userId)
  return (
    <div className="py-2">
      <HistoricoPageClient data={data} />
    </div>
  )
}
