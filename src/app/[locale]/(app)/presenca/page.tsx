import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/db/supabase/server'
import { listDrafts, hasAnyDraft, getVoiceSignal, getVoiceProfile } from '@/lib/db/drafts'
import { shouldSuggestRecalibration } from '@/lib/ai/content/recalibrateVoice'
import { getLatestSnapshot } from '@/lib/db/mirror'
import { getRecentEntries } from '@/lib/db/entries'
import type { PresencaSeedEntry } from '@/components/features/content/PresencaCreate'
import { RepertorioContent } from '@/components/features/presenca/RepertorioContent'
import { PageContainer } from '@/components/layout/PageContainer'
import { listPreparations } from '@/lib/db/preparations'

export const metadata: Metadata = {
  title: 'Usar | Borogodó',
}

const RECENT_ENTRY_SEEDS = 8
const HUB_PAGE_SIZE = 20

/**
 * Hub da Presença (014): a casa do conteúdo da pessoa. Lista paginada dos rascunhos ativos com
 * retomar/copiar/gerir, ponto de geração sempre acessível e caminhos de entrada quando vazio (nunca
 * página em branco). Server component: a 1ª página vem do servidor, escopada por `user_id` (RLS); a
 * interação (paginar/filtrar/gerir) vive no `PresencaHub`. Reusa o motor da 013.
 */
interface PresencaPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Normaliza `?hub`: só 'mostrar' | 'preparar' escopam a vista; qualquer outra coisa = ambos. */
function parseHub(raw: string | string[] | undefined): 'mostrar' | 'preparar' | undefined {
  return raw === 'mostrar' || raw === 'preparar' ? raw : undefined
}

export default async function PresencaPage({ searchParams }: PresencaPageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { hub: hubParam } = await searchParams
  const hub = parseHub(hubParam)

  // Geração de conteúdo está pausada no MVP. Só o fluxo de preparação permanece acessível.
  if (hub !== 'preparar') redirect('/painel')

  const [page, anyDrafts, snapshot, recentEntries, voiceSignal, voiceProfile, preparations] = await Promise.all([
    listDrafts(supabase, user.id, { limit: HUB_PAGE_SIZE }),
    hasAnyDraft(supabase, user.id),
    getLatestSnapshot(supabase, user.id),
    getRecentEntries(supabase, user.id, RECENT_ENTRY_SEEDS),
    getVoiceSignal(supabase, user.id),
    getVoiceProfile(supabase, user.id),
    listPreparations(supabase, user.id),
  ])

  const themes = snapshot?.strength_themes ?? []
  const entrySeeds: PresencaSeedEntry[] = recentEntries.map((e) => ({ id: e.id, whatIDid: e.what_i_did }))
  const suggestRecalibration = shouldSuggestRecalibration(voiceSignal, voiceProfile)

  return (
    <PageContainer className="pb-28 lg:pb-10">
      <RepertorioContent
        themes={themes}
        initialPage={page}
        hasAnyDrafts={anyDrafts}
        entries={entrySeeds}
        suggestRecalibration={suggestRecalibration}
        recalibrateSignalKey={voiceSignal.lastFeedbackAt}
        hub={hub}
        initialPreparations={preparations}
      />
    </PageContainer>
  )
}
