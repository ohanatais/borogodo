'use client'

import type { EntrySource } from '@/types/entry'
import { EntryCard } from '@/components/features/feed/EntryCard'
import type { FeedItem } from '@/lib/feed/types'

interface EntryItemProps {
  id: string
  whatIDid: string
  source: EntrySource
  createdAt: string
}

export function EntryItem({ id, whatIDid, source, createdAt }: EntryItemProps) {
  const item: FeedItem = {
    id,
    title: whatIDid.slice(0, 60).trim(),
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
  }

  return <EntryCard item={item} variant="panel" />
}
