'use client'

import type { EntrySource } from '@/types/entry'
import { SourceCard } from '@/components/features/feed/SourceCard'
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
    is_personal_project: false,
    role_title: null,
    metric: null,
    tags: [],
    thumbnail: null,
    evidences: [],
    impact: null,
    decision: null,
    learning: null,
    file_name: null,
    organized_at: null,
    organizing_started_at: null,
    highlights: [],
    organizationStatus: 'not_organized',
    contextStatus: 'unresolved',
  }

  return <SourceCard item={item} variant="panel" />
}
