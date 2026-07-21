import type { ContextStatus, EntrySource, SourceOrganizationStatus } from '@/types/entry'

export interface FeedEvidenceItem {
  type: 'url' | 'image'
  value: string
  label?: string
}

/**
 * US7 (026-organizar-destaques): forma mínima de um destaque dentro do card de fonte no feed —
 * subconjunto de `EntryHighlight` (sem `entry_id`/`user_id`/`position`/timestamps, que o feed
 * nunca precisa exibir). Fontes legadas sem linha em `entry_highlights` (FR-032) recebem um
 * destaque sintético único derivado dos campos legados da própria entry — nunca um array vazio.
 */
export interface FeedHighlight {
  id: string
  title: string | null
  metric: string | null
  impact: string | null
  tags: string[]
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
  // US3 (026-organizar-destaques): timestamps brutos usados por `deriveOrganizationStatus` para
  // o estado transitório "organizando…" no card — o `SourceCard` deriva ao vivo a partir deles
  // (não do campo `organizationStatus` abaixo), porque uma organização travada além do timeout
  // (FR-030) precisa se autocorrigir no cliente sem esperar um novo carregamento do feed.
  organized_at: string | null
  organizing_started_at: string | null
  // US7: destaques da fonte, já carregados no payload do feed (sem fetch lazy por card).
  highlights: FeedHighlight[]
  // US7: estados derivados também no servidor (contrato `feed.md`) — úteis para qualquer consumo
  // não interativo do feed (SSR puro, filtros futuros); o card interativo deriva os seus
  // próprios a partir dos campos brutos acima pelo motivo explicado ali.
  organizationStatus: SourceOrganizationStatus
  contextStatus: ContextStatus
}

export type FeedAxis = 'created_at' | 'entry_date'

export interface FeedQuery {
  axis: FeedAxis
  entryId?: string
  q?: string
  from?: string
  to?: string
  company?: string
  tags?: string[]
  metricOnly?: boolean
  source?: EntrySource
  cursor?: string
}

export interface FeedPage {
  items: FeedItem[]
  nextCursor: string | null
  total: number | null
}
