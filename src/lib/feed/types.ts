import type { EntrySource } from '@/types/entry'

export interface FeedItem {
  id: string
  title: string
  what_i_did: string
  source: EntrySource
  created_at: string
  entry_date: string | null
  company: string | null
  role_title: string | null
  metric: string | null
  tags: string[]
  thumbnail: string | null
  impact: string | null
  decision: string | null
  learning: string | null
  file_name: string | null
}

export type FeedAxis = 'created_at' | 'entry_date'

export interface FeedQuery {
  axis: FeedAxis
  q?: string
  from?: string
  to?: string
  company?: string
  tags?: string[]
  metricOnly?: boolean
  source?: EntrySource
  cursor?: string
}

export interface ActivityCell {
  date: string
  count: number
}

export interface FeedPage {
  items: FeedItem[]
  nextCursor: string | null
  total: number | null
}
