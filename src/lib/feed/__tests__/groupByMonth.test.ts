import { describe, it, expect } from 'vitest'
import { groupFeedItemsByMonth } from '../groupByMonth'
import type { FeedItem } from '../types'

function makeItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: 'entry-1',
    title: 'Título',
    what_i_did: 'Fez algo',
    source: 'deposito',
    created_at: '2026-07-10T12:00:00.000Z',
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
    ...overrides,
  }
}

describe('groupFeedItemsByMonth (FR-028)', () => {
  it('agrupa itens do mesmo mês num único grupo', () => {
    const items = [
      makeItem({ id: 'a', created_at: '2026-07-10T12:00:00.000Z' }),
      makeItem({ id: 'b', created_at: '2026-07-01T12:00:00.000Z' }),
    ]

    const groups = groupFeedItemsByMonth(items, 'created_at')

    expect(groups).toHaveLength(1)
    expect(groups[0].items.map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('cria um grupo por mês, na ordem em que os itens aparecem', () => {
    const items = [
      makeItem({ id: 'jul', created_at: '2026-07-10T12:00:00.000Z' }),
      makeItem({ id: 'jun', created_at: '2026-06-20T12:00:00.000Z' }),
    ]

    const groups = groupFeedItemsByMonth(items, 'created_at')

    expect(groups.map((g) => g.monthKey)).toEqual(['2026-07', '2026-06'])
  })

  it('rótulo do mês vem capitalizado', () => {
    const items = [makeItem({ created_at: '2026-07-10T12:00:00.000Z' })]

    const groups = groupFeedItemsByMonth(items, 'created_at')

    expect(groups[0].label[0]).toBe(groups[0].label[0].toUpperCase())
    expect(groups[0].label).toContain('2026')
  })

  it('com axis "entry_date", agrupa por entry_date em vez de created_at', () => {
    const items = [makeItem({ created_at: '2026-07-10T12:00:00.000Z', entry_date: '2026-03-01' })]

    const groups = groupFeedItemsByMonth(items, 'entry_date')

    expect(groups[0].monthKey).toBe('2026-03')
  })

  it('com axis "created_at" (default do feed), ignora entry_date — evita reabrir uma seção de mês já renderizada mais acima quando o feed está ordenado por created_at', () => {
    // Cenário do bug: 3 itens ordenados por created_at (a mais recente primeiro), mas com
    // entry_date bem diferente entre si. Se o agrupamento usasse entry_date aqui, o item 'c'
    // (entry_date de julho) reabriria o mesmo grupo do item 'a' — que já foi fechado pelo item
    // 'b' no meio — fazendo 'c' "pular" pra uma seção acima da sua posição real na lista.
    const items = [
      makeItem({ id: 'a', created_at: '2026-07-10T12:00:00.000Z', entry_date: '2026-01-05' }),
      makeItem({ id: 'b', created_at: '2026-07-09T12:00:00.000Z', entry_date: '2026-03-01' }),
      makeItem({ id: 'c', created_at: '2026-07-08T12:00:00.000Z', entry_date: '2026-01-20' }),
    ]

    const groups = groupFeedItemsByMonth(items, 'created_at')

    expect(groups).toHaveLength(1)
    expect(groups[0].monthKey).toBe('2026-07')
    expect(groups[0].items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('array vazio retorna nenhum grupo', () => {
    expect(groupFeedItemsByMonth([], 'created_at')).toEqual([])
  })
})
