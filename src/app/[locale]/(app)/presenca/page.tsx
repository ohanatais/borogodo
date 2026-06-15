import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { listDrafts } from '@/lib/db/drafts'
import { getLatestSnapshot } from '@/lib/db/mirror'
import { getRecentEntries } from '@/lib/db/entries'
import { PresencaList } from '@/components/features/content/PresencaList'
import { PresencaCreate, type PresencaSeedEntry } from '@/components/features/content/PresencaCreate'

export const metadata: Metadata = {
  title: 'Presença | Borogodó',
}

const RECENT_ENTRY_SEEDS = 8

/**
 * Hub da Presença (013): lista os rascunhos persistidos e dá um ponto de geração próprio. A pessoa
 * pode começar um rascunho aqui mesmo, a partir de uma evidência sua (tema do espelho ou entrada) —
 * nunca de uma página em branco. A geração continua reusando o motor da 013 via `GenerateSheet`.
 */
export default async function PresencaPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [drafts, snapshot, recentEntries, t] = await Promise.all([
    listDrafts(supabase, user.id),
    getLatestSnapshot(supabase, user.id),
    getRecentEntries(supabase, user.id, RECENT_ENTRY_SEEDS),
    getTranslations('presenca.page'),
  ])

  const themes = snapshot?.strength_themes ?? []
  const entrySeeds: PresencaSeedEntry[] = recentEntries.map((e) => ({ id: e.id, whatIDid: e.what_i_did }))

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
            {t('title')}
          </h1>
          <p className="text-base mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {t('subtitle')}
          </p>
        </div>
        {drafts.length > 0 && (
          <div className="shrink-0">
            <PresencaCreate themes={themes} entries={entrySeeds} />
          </div>
        )}
      </header>

      {drafts.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center flex flex-col items-center" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            {t('empty.title')}
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>
            {t('empty.description')}
          </p>
          <PresencaCreate themes={themes} entries={entrySeeds} />
        </div>
      ) : (
        <PresencaList drafts={drafts} />
      )}
    </div>
  )
}
