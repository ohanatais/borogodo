import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { listDrafts, hasAnyDraft, getVoiceFeedbackData, getVoiceProfile } from '@/lib/db/drafts'
import { shouldSuggestRecalibration } from '@/lib/ai/content/recalibrateVoice'
import { getLatestSnapshot } from '@/lib/db/mirror'
import { getRecentEntries } from '@/lib/db/entries'
import { PresencaCreate, type PresencaSeedEntry } from '@/components/features/content/PresencaCreate'
import { PresencaHub } from '@/components/features/presenca/PresencaHub'

export const metadata: Metadata = {
  title: 'Presença | Borogodó',
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

  const [page, anyDrafts, snapshot, recentEntries, feedback, voiceProfile, t] = await Promise.all([
    listDrafts(supabase, user.id, { limit: HUB_PAGE_SIZE }),
    hasAnyDraft(supabase, user.id),
    getLatestSnapshot(supabase, user.id),
    getRecentEntries(supabase, user.id, RECENT_ENTRY_SEEDS),
    getVoiceFeedbackData(supabase, user.id),
    getVoiceProfile(supabase, user.id),
    getTranslations('presenca.page'),
  ])

  const themes = snapshot?.strength_themes ?? []
  const entrySeeds: PresencaSeedEntry[] = recentEntries.map((e) => ({ id: e.id, whatIDid: e.what_i_did }))
  const suggestRecalibration = shouldSuggestRecalibration(feedback.signal, voiceProfile)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            {t('title')}
          </h1>
          <p className="text-base mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {t('subtitle')}
          </p>
        </div>
        <div className="shrink-0">
          <PresencaCreate themes={themes} entries={entrySeeds} />
        </div>
      </header>

      <PresencaHub
        initialPage={page}
        hasAnyDrafts={anyDrafts}
        themes={themes}
        entries={entrySeeds}
        suggestRecalibration={suggestRecalibration}
        recalibrateSignalKey={feedback.signal.lastFeedbackAt}
      />
    </div>
  )
}
