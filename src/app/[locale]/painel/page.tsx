import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { AppHeader } from '@/components/layout/AppHeader'
import { MirrorHeadline } from '@/components/features/painel/MirrorHeadline'
import { IndicatorStrip } from '@/components/features/painel/IndicatorStrip'
import { ProactiveInsightCard } from '@/components/features/painel/ProactiveInsightCard'
import { RecentEntries } from '@/components/features/painel/RecentEntries'
import { PanelEmptyState } from '@/components/features/painel/PanelEmptyState'
import { CaptureComposer } from '@/components/features/capture/CaptureComposer'
import { getPanelData } from '@/lib/panel/getPanelData'

export default async function PainelPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const data = await getPanelData(supabase, user.id)
  const name = data.name || user.email || ''
  const t = await getTranslations('painel')

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--color-creme)' }}>
      <AppHeader greeting={t('greeting', { name })} />

      <div className="flex-1">
        <MirrorHeadline headline={data.mirror?.headline ?? null} status={data.status} entryCount={data.entryCount} />
        {data.entryCount === 0 ? (
          <PanelEmptyState />
        ) : (
          <>
            <IndicatorStrip
              entryCount={data.entryCount}
              monthsSpan={data.monthsSpan}
              strengthCount={data.mirror?.strengthThemes.length ?? 0}
              daysSince={data.daysSince ?? 0}
            />
            <ProactiveInsightCard insight={data.insight} />
            <RecentEntries entries={data.recentEntries} />
          </>
        )}
      </div>

      <CaptureComposer placeholder={data.composerPlaceholder} />
    </main>
  )
}
