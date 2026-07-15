import type { FeedAxis, FeedItem } from './types'

export interface FeedMonthGroup {
  /** Chave estável de agrupamento (`AAAA-MM`) — nunca exibida, só usada como `key`/identidade. */
  monthKey: string
  /** Rótulo exibido (ex. "Julho de 2026"), já capitalizado — FR-028, ux-shape.md §8. */
  label: string
  items: FeedItem[]
}

// `entry_date` é uma data pura (AAAA-MM-DD, sem horário) — interpretá-la como meia-noite UTC e
// depois ler o mês em horário local pode "voltar" um dia (e o mês) em fusos atrás de UTC. Fixar
// meio-dia evita esse deslocamento, mesmo truque já usado em `ActivityGrid.getMonthLabel`.
//
// A data usada para agrupar MUST ser a mesma usada por `getFeedData` para ORDENAR a página
// (`axis`) — nunca uma escolha fixa. Se o feed está ordenado por `created_at` mas o agrupamento
// usasse `entry_date` (que pode divergir muito de `created_at`), itens do mesmo mês de
// `entry_date` poderiam aparecer espalhados/fora de ordem na lista (a ordenação real é por
// `created_at`), e o agrupamento por chave reabriria uma seção já renderizada mais acima —
// resultando num item "voltando" visualmente para um mês anterior na tela.
function displayDateOf(item: FeedItem, axis: FeedAxis): Date {
  const raw = axis === 'entry_date' ? (item.entry_date ?? item.created_at) : item.created_at
  return new Date(raw.includes('T') ? raw : `${raw}T12:00:00`)
}

function monthKeyOf(item: FeedItem, axis: FeedAxis): string {
  const date = displayDateOf(item, axis)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabelOf(item: FeedItem, axis: FeedAxis): string {
  const label = displayDateOf(item, axis).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * FR-028: agrupa os itens do feed (já ordenados por `getFeedData` conforme `axis`) numa timeline
 * por mês, usando a MESMA data que determinou a ordenação (`axis`) — nunca uma escolha fixa (ver
 * nota acima). Itens do mesmo mês que já chegam contíguos (ordenação normal do feed) formam um
 * único grupo; a chave por mês (não por posição) também cobre o caso raro de itens do mesmo mês
 * reaparecerem depois de uma quebra (ex. "load more" cruzando um mês intermediário já visto).
 */
export function groupFeedItemsByMonth(items: FeedItem[], axis: FeedAxis): FeedMonthGroup[] {
  const groups: FeedMonthGroup[] = []
  const indexByKey = new Map<string, number>()

  for (const item of items) {
    const monthKey = monthKeyOf(item, axis)
    const existingIndex = indexByKey.get(monthKey)

    if (existingIndex === undefined) {
      indexByKey.set(monthKey, groups.length)
      groups.push({ monthKey, label: monthLabelOf(item, axis), items: [item] })
    } else {
      groups[existingIndex].items.push(item)
    }
  }

  return groups
}
