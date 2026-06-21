import type { PeriodRecapItem } from './periodRecap'

/**
 * Âncora dos sentence-stems (019, US1, research D6). A âncora é TEMPORAL (o `occurredAt` do registro
 * mais recente do período): o molde "Em {mês}, eu…" fica sempre gramatical, ao contrário de injetar um
 * trecho cru do registro (que começa em verbo e quebra a frase). Só `entregas` tem âncora; as demais
 * seções usam molde fixo. Sem registros → objeto vazio (placeholder neutro, nunca inventa).
 */
export interface SentenceStemAnchors {
  /** ISO date de um registro do período; a UI formata o mês ("março de 2025") no placeholder. */
  entregasMonth?: string
}

export function buildSentenceStems(items: PeriodRecapItem[]): SentenceStemAnchors {
  if (items.length === 0) return {}
  return { entregasMonth: items[0].occurredAt }
}
