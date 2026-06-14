import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { AppHeader } from '@/components/layout/AppHeader'
import { BorogodoCard } from '@/components/features/painel/BorogodoCard'
import { IndicatorStrip } from '@/components/features/painel/IndicatorStrip'
import { ProactiveInsightCard } from '@/components/features/painel/ProactiveInsightCard'
import { RecentEntries } from '@/components/features/painel/RecentEntries'
import { PanelEmptyState } from '@/components/features/painel/PanelEmptyState'
import { MiniTimeline } from '@/components/features/painel/MiniTimeline'
import { TrajectoryHighlights } from '@/components/features/painel/TrajectoryHighlights'
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
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--color-creme, var(--background))' }}>
      <AppHeader greeting={t('greeting', { name })} />

      <div className="flex-1 px-4 py-4 max-w-3xl mx-auto w-full">
        {data.entryCount === 0 ? (
          <PanelEmptyState />
        ) : (
          /* Desktop: 2-col grid (main | mini-timeline). Mobile: stacked column. */
          <div className="md:grid md:grid-cols-[1fr_256px] md:gap-6 md:items-start">
            {/* Main column */}
            <div className="min-w-0">
              <BorogodoCard
                name={name}
                mirror={data.mirror}
                entryCount={data.entryCount}
              />

              <IndicatorStrip
                entryCount={data.entryCount}
                monthsSpan={data.monthsSpan}
                strengthCount={data.mirror?.strengthThemes.length ?? 0}
                daysSince={data.daysSince ?? 0}
              />

              <TrajectoryHighlights highlights={data.highlights} />

              <ProactiveInsightCard insight={data.insight} />

              <RecentEntries entries={data.recentEntries} />
            </div>

            {/* MiniTimeline — single render; appears after main on mobile, sticky sidebar on desktop */}
            <div className="mt-4 px-4 md:mt-0 md:px-0 md:sticky md:top-4">
              <MiniTimeline entries={data.timelineEntries} />
            </div>
          </div>
        )}
      </div>

      <CaptureComposer placeholder={data.composerPlaceholder} />
    </main>
  )
}
