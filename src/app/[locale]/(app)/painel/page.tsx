import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase/server'
import { PageContainer } from '@/components/layout/PageContainer'
import { HomeGreeting } from '@/components/features/painel/HomeGreeting'
import { RegistroTrigger } from '@/components/features/painel/RegistroTrigger'
import { SuasForcas } from '@/components/features/painel/SuasForcas'
import { RegistrosRecentes } from '@/components/features/painel/RegistrosRecentes'
import { NewAccountPrompt } from '@/components/features/painel/NewAccountPrompt'
import { ReviewCycleInvite } from '@/components/features/painel/ReviewCycleInvite'
import { getPanelData } from '@/lib/panel/getPanelData'
import { FIRST_MIRROR_MIN_ENTRIES } from '@/lib/ai/mirror/maybeRegenerate'

/**
 * Painel (025-registro-deposito, US5) — saudação → gatilho único de Registro → "Suas forças" →
 * "Registros recentes". Substitui a barra fixa "Registrar | Perguntar" (agora no shell, US6) e o
 * cartão pesado de Espelho (`BorogodoCard`, cuja função de resumo passa a `SuasForcas`).
 * `PainelChatDoor` sai — "Perguntar" já vive na navegação (grupo "Usar", US6), redundante como
 * faixa de descoberta aqui.
 *
 * Largura/padding via `PageContainer` (mesmo contêiner de `/espelho`) — decisão direta da Ohana
 * revisando a versão live: o Painel tinha `max-w-[720px]` próprio (plano original do design-brief),
 * divergindo de `/espelho` e do próprio skeleton de `loading.tsx` (que já usava 980px). Padronizado
 * pra parar de "quebrar a cada feature nova".
 *
 * `ProactiveInsightCard`/`TrajectoryHighlights` (features 014/017) removidos do Painel — decisão
 * direta da Ohana revisando a versão live (não fazem mais sentido no produto). Componentes
 * apagados também de `src/components/features/painel/`.
 */
export default async function PainelPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const data = await getPanelData(supabase, user.id)
  const name = data.name || ''

  return (
    <PageContainer className="pb-36 lg:pb-40">
      {/* Convite do ciclo de avaliação (019) — banner sensível a calendário, no topo do painel. */}
      <ReviewCycleInvite signal={data.reviewCycleSignal} />

      {data.entryCount === 0 ? (
        <NewAccountPrompt entryCount={data.entryCount} firstMirrorMinEntries={FIRST_MIRROR_MIN_ENTRIES} />
      ) : (
        <>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <HomeGreeting name={name} />
            <RegistroTrigger />
          </div>

          <div className="mt-10 flex flex-col gap-12">
            <SuasForcas mirror={data.mirror} />
            <RegistrosRecentes entries={data.recentEntries} />
          </div>
        </>
      )}
    </PageContainer>
  )
}
