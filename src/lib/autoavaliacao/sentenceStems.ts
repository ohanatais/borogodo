import type { PeriodRecapItem } from './periodRecap'

/**
 * Âncoras dos sentence-stems (019, US1, research D6). Só `entregas` e `impacto` têm âncora (os moldes
 * "Em {anchor}, eu…" / "O resultado de {anchor} foi…"); `evolucao`/`pontos_a_desenvolver` usam molde
 * fixo sem âncora. Sem registros → objeto vazio (o editor cai num placeholder neutro, nunca inventa).
 */
export interface SentenceStemAnchors {
  entregas?: string
  impacto?: string
}

const MAX_ANCHOR_WORDS = 6

/** Trecho curto e factual de um registro — âncora do molde, nunca o registro inteiro. */
function snippet(text: string): string {
  return text.trim().split(/\s+/).slice(0, MAX_ANCHOR_WORDS).join(' ')
}

/**
 * Moldes determinísticos preenchidos com âncoras vindas dos itens REAIS do recap (mata a página em
 * branco sem ghostwriting). Quando há mais de um registro, entregas e impacto ancoram em itens
 * distintos para não repetir a mesma frase.
 */
export function buildSentenceStems(items: PeriodRecapItem[]): SentenceStemAnchors {
  if (items.length === 0) return {}
  return {
    entregas: snippet(items[0].text),
    impacto: snippet((items[1] ?? items[0]).text),
  }
}
