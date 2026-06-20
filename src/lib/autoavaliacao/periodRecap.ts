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

/**
 * Recap "o seu ano, em fatos" (019, US1) — DETERMINÍSTICO, sem LLM (research D2). É uma transformação
 * de apresentação sobre os registros do período: cada item é exatamente o `what_i_did` da entrada (zero
 * invenção, zero adjetivo por construção), com a fonte e a data. Colhe SÓ de `entries` (capturas reais),
 * escopado por `user_id` (RLS) — a autoavaliação escrita pela pessoa (em `drafts`) jamais entra aqui,
 * senão a interpretação dela voltaria como "fato" (isolamento).
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
    .gte('entry_date', from)
    .lte('entry_date', to)
    .order('entry_date', { ascending: false })
    .limit(MAX_RECAP_ITEMS)

  const items: PeriodRecapItem[] = (data ?? []).map((r) => {
    const row = r as RecapRow
    return {
      text: row.what_i_did,
      sourceEntryId: row.id,
      occurredAt: row.entry_date ?? row.created_at,
    }
  })

  return { items, isLimited: items.length === 0 }
}
