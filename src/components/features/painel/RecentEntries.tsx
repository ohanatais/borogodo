import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { EntrySource } from '@/types/entry'
import { EntryItem } from './EntryItem'

const MAX_VISIBLE_ENTRIES = 5

interface RecentEntry {
  id: string
  what_i_did: string
  title?: string | null
  source: EntrySource
  created_at: string
}

interface RecentEntriesProps {
  entries: RecentEntry[]
}

export function RecentEntries({ entries }: RecentEntriesProps) {
  const t = useTranslations('panel')
  const feedT = useTranslations('feed')

  if (entries.length === 0) return null

  const visibleEntries = entries.slice(0, MAX_VISIBLE_ENTRIES)

  return (
    <section className="px-6 py-4 space-y-2">
      <h2 className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>
        {t('recentEntries.title')}
      </h2>
      <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {visibleEntries.map((entry) => (
          <EntryItem
            key={entry.id}
            id={entry.id}
            whatIDid={entry.what_i_did}
            source={entry.source}
            createdAt={entry.created_at}
          />
        ))}
      </ul>
      <Link
        href="/registros"
        className="inline-block text-sm font-medium mt-1 transition-opacity hover:opacity-70"
        style={{ color: 'var(--color-primary)' }}
      >
        {feedT('viewAll')}
      </Link>
    </section>
  )
}
