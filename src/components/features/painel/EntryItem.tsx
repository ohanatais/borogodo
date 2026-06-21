'use client'

import type { EntrySource } from '@/types/entry'
import { EntryCard } from '@/components/features/feed/EntryCard'
import type { FeedItem } from '@/lib/feed/types'

interface EntryItemProps {
  id: string
  whatIDid: string
  title?: string | null
  source: EntrySource
  createdAt: string
}

function truncateToWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  const sliced = text.slice(0, maxLen)
  const lastSpace = sliced.lastIndexOf(' ')
  return lastSpace > maxLen * 0.4 ? sliced.slice(0, lastSpace) : sliced
}

export function EntryItem({ id, whatIDid, title, source, createdAt }: EntryItemProps) {
  const item: FeedItem = {
    id,
    title: title ?? truncateToWord(whatIDid, 80),
    what_i_did: whatIDid,
    source,
    created_at: createdAt,
    entry_date: null,
    company: null,
    role_title: null,
    metric: null,
    tags: [],
    thumbnail: null,
    impact: null,
    decision: null,
    learning: null,
    file_name: null,
  }

  return <EntryCard item={item} variant="panel" />
}
