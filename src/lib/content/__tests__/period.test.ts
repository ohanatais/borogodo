import { describe, it, expect } from 'vitest'
import {
  serializePeriodSeedRef,
  parsePeriodSeedRef,
  resolvePeriodPreset,
} from '../period'

describe('period — serialize/parse', () => {
  it('faz round-trip serialize → parse no formato period:::<from>:::<to>', () => {
    const ref = serializePeriodSeedRef('2025-01-01', '2025-06-30')
    expect(ref).toBe('period:::2025-01-01:::2025-06-30')
    expect(parsePeriodSeedRef(ref)).toEqual({ from: '2025-01-01', to: '2025-06-30' })
  })

  it('aceita intervalo de um único dia (from === to)', () => {
    const ref = serializePeriodSeedRef('2025-03-15', '2025-03-15')
    expect(parsePeriodSeedRef(ref)).toEqual({ from: '2025-03-15', to: '2025-03-15' })
  })

  it('devolve null quando o range é invertido (from > to)', () => {
    expect(parsePeriodSeedRef('period:::2025-06-30:::2025-01-01')).toBeNull()
  })

  it('devolve null quando as datas não são parseáveis', () => {
    expect(parsePeriodSeedRef('period:::não-é-data:::2025-01-01')).toBeNull()
    expect(parsePeriodSeedRef('period:::2025-13-99:::2025-12-31')).toBeNull()
  })

  it('devolve null quando o ref está malformado (prefixo errado ou partes faltando)', () => {
    expect(parsePeriodSeedRef('2025-01-01:::2025-06-30')).toBeNull()
    expect(parsePeriodSeedRef('period:::2025-01-01')).toBeNull()
    expect(parsePeriodSeedRef('sem-separador')).toBeNull()
    expect(parsePeriodSeedRef('')).toBeNull()
  })
})

describe('period — presets (now injetável para determinismo)', () => {
  it('este_ano: 1º de janeiro até hoje do ano de `now`', () => {
    const now = new Date('2026-06-17T12:00:00Z')
    expect(resolvePeriodPreset('este_ano', now)).toEqual({ from: '2026-01-01', to: '2026-06-17' })
  })

  it('ultimo_ciclo: 6 meses anteriores a `now` (até hoje)', () => {
    const now = new Date('2026-06-17T12:00:00Z')
    expect(resolvePeriodPreset('ultimo_ciclo', now)).toEqual({ from: '2025-12-17', to: '2026-06-17' })
  })

  it('presets resolvem para refs serializáveis e re-parseáveis', () => {
    const now = new Date('2026-06-17T12:00:00Z')
    const range = resolvePeriodPreset('este_ano', now)
    const ref = serializePeriodSeedRef(range.from, range.to)
    expect(parsePeriodSeedRef(ref)).toEqual(range)
  })
})
