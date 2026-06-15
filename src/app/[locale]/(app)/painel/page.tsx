import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase/server'
import { BorogodoCard } from '@/components/features/painel/BorogodoCard'
import { ProactiveInsightCard } from '@/components/features/painel/ProactiveInsightCard'
import { PanelEmptyState } from '@/components/features/painel/PanelEmptyState'
import { MiniTimeline } from '@/components/features/painel/MiniTimeline'
import { TrajectoryHighlights } from '@/components/features/painel/TrajectoryHighlights'
import { getPanelData } from '@/lib/panel/getPanelData'

export default async function PainelPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const data = await getPanelData(supabase, user.id)
  const name = data.name || user.email || ''

  return (
    <div className="px-5 lg:px-9 py-4 max-w-[980px] mx-auto w-full">
      {data.entryCount === 0 ? (
        <PanelEmptyState />
      ) : (
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-8 lg:items-start">
          {/* Main column */}
          <div className="min-w-0">
            <BorogodoCard
              name={name}
              avatarUrl={data.avatarUrl}
              mirror={data.mirror}
              entryCount={data.entryCount}
            />
            <TrajectoryHighlights highlights={data.highlights} />
            <ProactiveInsightCard insight={data.insight} />
          </div>

          {/* MiniTimeline — sticky sidebar on lg+, stacked below on mobile */}
          <div className="mt-6 lg:mt-0 lg:sticky lg:top-4">
            <MiniTimeline entries={data.timelineEntries} />
          </div>
        </div>
      )}
    </div>
  )
}
