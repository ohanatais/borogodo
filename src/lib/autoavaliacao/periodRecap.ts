import type { createServerClient } from '@/lib/db/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

/** Um item do recap "o seu ano, em fatos": o registro cru + a fonte clicável + quando ocorreu. */
export interface PeriodRecapItem {
  /** O texto factual do registro (what_i_did), sem adjetivo nem síntese. */
  text: string
  /** A `entry` de origem — vira o chip de fonte clicável na UI. */
  sourceEntryId: string
  /** ISO: `entry_date` quando houver, senão `created_at`. */
  occurredAt: string
}

export interface PeriodRecap {
  items: PeriodRecapItem[]
  /** `true` quando o período não tem registros: a UI convida a registrar, nunca fabrica (FR-006). */
  isLimited: boolean
}

/** Teto de itens do recap — protege a UI em intervalos longos (espelha MAX_PERIOD_EVIDENCE do seed). */
const MAX_RECAP_ITEMS = 50

const RECAP_COLUMNS = 'id, what_i_did, entry_date, created_at'

interface RecapRow {
  id: string
  what_i_did: string
  entry_date: string | null
  created_at: string
}

/** A data-only (`YYYY-MM-DD`) do `occurredAt`, seja ele date puro ou ISO timestamp. Compara como string. */
function dayOf(occurredAt: string): string {
  return occurredAt.slice(0, 10)
}

/**
 * Recap "o seu ano, em fatos" (019, US1) — DETERMINÍSTICO, sem LLM (research D2). Cada item é exatamente
 * o `what_i_did` do registro (zero invenção/adjetivo por construção), com a fonte e a data. Colhe SÓ de
 * `entries` (capturas reais), escopado por `user_id` (RLS) — a autoavaliação escrita (em `drafts`) jamais
 * entra aqui (isolamento). O recorte do período é por `occurredAt` = `entry_date` quando houver, senão
 * `created_at` (data-model): registros sem data explícita ainda contam pelo momento da captura. A
 * comparação é por string `YYYY-MM-DD` (estável a fuso — evita o off-by-one de `new Date('2026-01-01')`).
 */
export async function loadPeriodRecap(
  supabase: SupabaseServerClient,
  userId: string,
  from: string,
  to: string
): Promise<PeriodRecap> {
  const { data } = await supabase
    .from('entries')
    .select(RECAP_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_RECAP_ITEMS)

  const items: PeriodRecapItem[] = (data ?? [])
    .map((r) => {
      const row = r as RecapRow
      return {
        text: row.what_i_did,
        sourceEntryId: row.id,
        occurredAt: row.entry_date ?? row.created_at,
      }
    })
    .filter((item) => {
      const day = dayOf(item.occurredAt)
      return day >= from && day <= to
    })

  return { items, isLimited: items.length === 0 }
}
