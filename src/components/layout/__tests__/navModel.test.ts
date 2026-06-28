import { describe, it, expect } from 'vitest'
import { NAV_DESTINOS, isActive } from '../navModel'

describe('navModel', () => {
  it('expõe exatamente 4 destinos de topo', () => {
    expect(NAV_DESTINOS).toHaveLength(4)
    expect(NAV_DESTINOS.map((d) => d.id)).toEqual(['painel', 'espelho', 'registros', 'usar'])
  })

  it('cada destino tem labelKey em appNav.*', () => {
    for (const d of NAV_DESTINOS) {
      expect(d.labelKey).toMatch(/^appNav\./)
    }
  })

  it('acende o destino quando o pathname casa o path base', () => {
    expect(isActive(NAV_DESTINOS[0], '/painel')).toBe(true)
    expect(isActive(NAV_DESTINOS[1], '/espelho')).toBe(true)
    expect(isActive(NAV_DESTINOS[2], '/registros')).toBe(true)
  })

  it('agrupa /presenca e /autoavaliacao sob "Usar"', () => {
    const usar = NAV_DESTINOS.find((d) => d.id === 'usar')!
    expect(isActive(usar, '/usar')).toBe(true)
    expect(isActive(usar, '/presenca')).toBe(true)
    expect(isActive(usar, '/autoavaliacao')).toBe(true)
    expect(isActive(usar, '/painel')).toBe(false)
  })

  it('Espelho permanece ativo com ?vista (o pathname não muda)', () => {
    const espelho = NAV_DESTINOS.find((d) => d.id === 'espelho')!
    // o pathname é sempre /espelho; a vista vive na query string
    expect(isActive(espelho, '/espelho')).toBe(true)
  })

  it('não confunde prefixos parciais entre destinos distintos', () => {
    const painel = NAV_DESTINOS.find((d) => d.id === 'painel')!
    expect(isActive(painel, '/espelho')).toBe(false)
  })
})
