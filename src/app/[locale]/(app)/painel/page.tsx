import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase/server'
import { BorogodoCard } from '@/components/features/painel/BorogodoCard'
import { PainelChatDoor } from '@/components/features/painel/PainelChatDoor'
import { ProactiveInsightCard } from '@/components/features/painel/ProactiveInsightCard'
import { PanelEmptyState } from '@/components/features/painel/PanelEmptyState'
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
    <div className="px-6 pt-4 pb-36 lg:pb-40 max-w-[980px] mx-auto w-full">
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

          {/* Porta de conversa (021): faixa de descoberta logo abaixo do hero — ensina que dá pra
              perguntar qualquer coisa (o toggle "Perguntar" da barra global é discreto demais). */}
          <div className="mt-4">
            <PainelChatDoor />
          </div>

          {/* Coluna única (021): hero → porta de chat → prova (conquistas) → insight → recentes. O
              convite "Usar" e a mini-timeline saíram — viviam no destino Usar e no Espelho→Trajetória.
              Um eixo de leitura, sem rail paralelo. */}
          <div className="mt-6 flex flex-col gap-6">
            <TrajectoryHighlights highlights={data.highlights} />
            <ProactiveInsightCard insight={data.insight} />
            <RecentEntries entries={data.recentEntries} />
          </div>
        </>
      )}
    </div>
  )
}
