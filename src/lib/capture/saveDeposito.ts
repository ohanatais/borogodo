import type { createServerClient } from '@/lib/db/supabase/server'
import { buildEntryTitle } from './buildEntryTitle'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

// Piso técnico (mesmo limite já usado pelo caminho `kind: 'text'`), não um gate de produto —
// FR-001 proíbe qualquer limite mínimo, mas um teto máximo evita linhas absurdas no banco.
const MAX_TEXT_LENGTH = 20_000

export interface ManualFields {
  metric?: string | null
  impact?: string | null
  tags?: string[]
  company?: string | null
  isPersonalProject?: boolean
  entryDate?: string | null
}

export interface SaveDepositoInput {
  rawText: string
  manualFields?: ManualFields
}

export interface SaveDepositoResult {
  id: string
  title: string
}

/** Erro de domínio: `rawText` vazio após `trim()` — único caso de rejeição de conteúdo (contracts/capture.md). */
export class EmptyContentError extends Error {
  constructor() {
    super('Texto vazio')
    this.name = 'EmptyContentError'
  }
}

/**
 * Salva um registro direto (drawer "sempre salva"), sem nenhuma chamada de IA no caminho crítico
 * (FR-004). Diferente de `saveEntries`, não gera embedding nem faz dedup semântico — isso é
 * deliberado (research.md §1/§2): dedup semântico é assíncrono/opcional e não pode bloquear o
 * insert nem depender de uma chamada de IA para o salvamento responder.
 */
export async function saveDeposito(
  supabase: SupabaseServerClient,
  userId: string,
  input: SaveDepositoInput
): Promise<SaveDepositoResult> {
  const rawText = input.rawText.trim()
  if (!rawText) {
    throw new EmptyContentError()
  }

  const verbatimText = rawText.slice(0, MAX_TEXT_LENGTH)
  const title = buildEntryTitle(verbatimText)
  const manual = input.manualFields ?? {}

  const row = {
    user_id: userId,
    what_i_did: verbatimText,
    raw_content: verbatimText,
    title,
    source: 'deposito' as const,
    metric: manual.metric ?? null,
    impact: manual.impact ?? null,
    tags: manual.tags ?? [],
    company: manual.company ?? null,
    is_personal_project: manual.isPersonalProject ?? false,
    entry_date: manual.entryDate ?? null,
  }

  const { data, error } = await supabase
    .from('entries')
    .insert(row)
    .select('id, title')
    .single()

  if (error || !data) {
    throw new Error('Não foi possível salvar o registro')
  }

  return { id: data.id as string, title: (data.title as string) ?? title }
}
