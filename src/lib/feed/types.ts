import type { EntrySource } from '@/types/entry'

export interface FeedEvidenceItem {
  type: 'url' | 'image'
  value: string
  label?: string
}

export interface FeedItem {
  id: string
  title: string
  what_i_did: string
  source: EntrySource
  created_at: string
  entry_date: string | null
  company: string | null
  // Story 2 (026-organizar-destaques): `true` quando a pílula "Projeto pessoal" foi selecionada —
  // contexto resolvido mesmo sem `company` (ver `deriveContextStatus`).
  is_personal_project: boolean
  role_title: string | null
  metric: string | null
  tags: string[]
  thumbnail: string | null
  /** Anexos (imagem/link) persistidos via `POST /api/entries/[id]/evidence` — 025-registro-deposito. */
  evidences: FeedEvidenceItem[]
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
