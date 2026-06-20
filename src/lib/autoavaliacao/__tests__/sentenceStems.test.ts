import { describe, it, expect } from 'vitest'
import { buildSentenceStems } from '../sentenceStems'
import type { PeriodRecapItem } from '../periodRecap'

const items: PeriodRecapItem[] = [
  { text: 'Liderei o lançamento do app de pagamentos no primeiro semestre', sourceEntryId: 'e1', occurredAt: '2025-03-10' },
  { text: 'Conduzi a pesquisa com 12 clientes enterprise', sourceEntryId: 'e2', occurredAt: '2025-05-02' },
]

describe('buildSentenceStems — moldes ancorados no seed do período (US1, 019)', () => {
  it('a âncora de cada seção sai de um item real do recap (não é genérica)', () => {
    const stems = buildSentenceStems(items)
    // O molde "Em {anchor}, eu…" / "O resultado de {anchor} foi…" ancora em fato do período.
    expect(items[0].text).toContain(stems.entregas as string)
    expect(stems.impacto).toBeTruthy()
    expect(`${items[0].text} ${items[1].text}`).toContain(stems.impacto as string)
  })

  it('entregas e impacto ancoram em itens distintos quando há mais de um registro', () => {
    const stems = buildSentenceStems(items)
    expect(stems.entregas).not.toBe(stems.impacto)
  })

  it('a âncora é um trecho curto (não despeja o registro inteiro)', () => {
    const stems = buildSentenceStems(items)
    expect((stems.entregas as string).length).toBeLessThanOrEqual(items[0].text.length)
    expect((stems.entregas as string).split(/\s+/).length).toBeLessThanOrEqual(6)
  })

  it('sem registros → sem âncoras (o editor cai num placeholder neutro, nunca inventa)', () => {
    const stems = buildSentenceStems([])
    expect(stems.entregas).toBeUndefined()
    expect(stems.impacto).toBeUndefined()
  })
})
