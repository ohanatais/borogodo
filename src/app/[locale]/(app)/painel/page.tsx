import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase/server'
import { BorogodoCard } from '@/components/features/painel/BorogodoCard'
import { UsarInvite } from '@/components/features/painel/UsarInvite'
import { ProactiveInsightCard } from '@/components/features/painel/ProactiveInsightCard'
import { PainelChatDoor } from '@/components/features/painel/PainelChatDoor'
import { PanelEmptyState } from '@/components/features/painel/PanelEmptyState'
import { MiniTimeline } from '@/components/features/painel/MiniTimeline'
import { RecentEntries } from '@/components/features/painel/RecentEntries'
import { ReviewCycleInvite } from '@/components/features/painel/ReviewCycleInvite'
import { TrajectoryHighlights } from '@/components/features/painel/TrajectoryHighlights'
import { getPanelData } from '@/lib/panel/getPanelData'

export default async function PainelPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const data = await getPanelData(supabase, user.id)
  const name = data.name || ''

  return (
    <div className="px-5 lg:px-9 pt-4 pb-36 lg:pb-40 max-w-[980px] mx-auto w-full">
      {data.entryCount === 0 ? (
        <PanelEmptyState />
      ) : (
        <>
          {/* Convite do ciclo de avaliação (019) — banner sensível a calendário, no topo do painel. */}
          <ReviewCycleInvite signal={data.reviewCycleSignal} />
          {/* Identity hero — slim, the headline is the star */}
          <BorogodoCard
            name={name}
            avatarUrl={data.avatarUrl}
            mirror={data.mirror}
            entryCount={data.entryCount}
          />

          {/* Porta de conversa (021) — aditiva, logo abaixo do hero; abre o chat em modo pergunta. */}
          <div className="mt-4">
            <PainelChatDoor />
          </div>

          <div className="mt-6 lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start">
            {/* Main — the proof: concrete wins, the proactive insight, then recent activity → feed */}
            <div className="min-w-0 flex flex-col gap-6">
              <TrajectoryHighlights highlights={data.highlights} />
              <ProactiveInsightCard insight={data.insight} />
              <RecentEntries entries={data.recentEntries} />
            </div>

            {/* Rail — action first (Repertório), context second (timeline). Sticky on lg+ */}
            <aside className="mt-6 lg:mt-0 lg:sticky lg:top-4 flex flex-col gap-6">
              <UsarInvite />
              <MiniTimeline entries={data.timelineEntries} />
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
