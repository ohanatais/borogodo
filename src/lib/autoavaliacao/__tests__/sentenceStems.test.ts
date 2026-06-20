import { describe, it, expect } from 'vitest'
import { buildSentenceStems } from '../sentenceStems'
import type { PeriodRecapItem } from '../periodRecap'

const items: PeriodRecapItem[] = [
  { text: 'Liderei o lançamento do app de pagamentos', sourceEntryId: 'e1', occurredAt: '2025-03-10' },
  { text: 'Conduzi a pesquisa com 12 clientes enterprise', sourceEntryId: 'e2', occurredAt: '2025-05-02' },
]

describe('buildSentenceStems — âncora temporal gramatical (US1, 019)', () => {
  it('entregas ancora no registro mais recente (occurredAt) — a UI formata o mês', () => {
    const stems = buildSentenceStems(items)
    // A âncora é uma data ISO real do período (vira "Em março de 2025, eu…"), nunca um trecho de verbo.
    expect(stems.entregasMonth).toBe('2025-03-10')
  })

  it('sem registros → sem âncora (o editor cai num placeholder neutro, nunca inventa)', () => {
    const stems = buildSentenceStems([])
    expect(stems.entregasMonth).toBeUndefined()
  })
})
