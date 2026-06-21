import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/db/supabase/server'
import { listDrafts, hasAnyDraft, getVoiceSignal, getVoiceProfile } from '@/lib/db/drafts'
import { shouldSuggestRecalibration } from '@/lib/ai/content/recalibrateVoice'
import { getLatestSnapshot } from '@/lib/db/mirror'
import { getRecentEntries } from '@/lib/db/entries'
import type { PresencaSeedEntry } from '@/components/features/content/PresencaCreate'
import { RepertorioContent } from '@/components/features/presenca/RepertorioContent'

export const metadata: Metadata = {
  title: 'Repertório | Borogodó',
}

const RECENT_ENTRY_SEEDS = 8
const HUB_PAGE_SIZE = 20

/**
 * Hub da Presença (014): a casa do conteúdo da pessoa. Lista paginada dos rascunhos ativos com
 * retomar/copiar/gerir, ponto de geração sempre acessível e caminhos de entrada quando vazio (nunca
 * página em branco). Server component: a 1ª página vem do servidor, escopada por `user_id` (RLS); a
 * interação (paginar/filtrar/gerir) vive no `PresencaHub`. Reusa o motor da 013.
 */
export default async function PresencaPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [page, anyDrafts, snapshot, recentEntries, voiceSignal, voiceProfile] = await Promise.all([
    listDrafts(supabase, user.id, { limit: HUB_PAGE_SIZE }),
    hasAnyDraft(supabase, user.id),
    getLatestSnapshot(supabase, user.id),
    getRecentEntries(supabase, user.id, RECENT_ENTRY_SEEDS),
    getVoiceSignal(supabase, user.id),
    getVoiceProfile(supabase, user.id),
  ])

  const themes = snapshot?.strength_themes ?? []
  const entrySeeds: PresencaSeedEntry[] = recentEntries.map((e) => ({ id: e.id, whatIDid: e.what_i_did }))
  const suggestRecalibration = shouldSuggestRecalibration(voiceSignal, voiceProfile)

  return (
    <div className="max-w-[980px] mx-auto px-6 py-8">
      <RepertorioContent
        themes={themes}
        initialPage={page}
        hasAnyDrafts={anyDrafts}
        entries={entrySeeds}
        suggestRecalibration={suggestRecalibration}
        recalibrateSignalKey={voiceSignal.lastFeedbackAt}
      />
    </div>
  )
}
