import { describe, it, expect } from 'vitest'
import {
  HUBS,
  PREP_MOMENTS,
  PREP_MOMENT_ORDER,
  isPrepMoment,
} from '../intentions'

describe('intentions', () => {
  it('define os dois hubs por intenção', () => {
    expect(HUBS).toEqual(['mostrar', 'preparar'])
  })

  it('cobre os três momentos de preparação na ordem da v1', () => {
    expect(PREP_MOMENT_ORDER).toEqual(['entrevista', 'review', 'salario'])
  })

  it('cada momento tem um ângulo de geração e starters próprios', () => {
    for (const m of PREP_MOMENT_ORDER) {
      const moment = PREP_MOMENTS[m]
      expect(moment.angleHint.length).toBeGreaterThan(0)
      expect(moment.starters.length).toBeGreaterThanOrEqual(2)
      expect(moment.starters.every((s) => s.trim().length > 0)).toBe(true)
    }
  })

  it('os starters não usam travessão, seta ou barra como separador (convenção de conteúdo)', () => {
    for (const m of PREP_MOMENT_ORDER) {
      for (const s of PREP_MOMENTS[m].starters) {
        expect(s).not.toMatch(/[—→]|\s\/\s|->/)
      }
    }
  })

  it('isPrepMoment reconhece momentos válidos e rejeita o resto', () => {
    expect(isPrepMoment('entrevista')).toBe(true)
    expect(isPrepMoment('review')).toBe(true)
    expect(isPrepMoment('salario')).toBe(true)
    expect(isPrepMoment('post')).toBe(false)
    expect(isPrepMoment('')).toBe(false)
  })
})
