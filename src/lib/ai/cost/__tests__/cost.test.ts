import { describe, it, expect } from 'vitest'
import { costUsd } from '../cost'

describe('costUsd', () => {
  it('calcula custo de uma síntese Sonnet (3/15 por milhão)', () => {
    // 1M in + 1M out = 3 + 15 = 18
    expect(costUsd('claude-sonnet-4-6', 1_000_000, 1_000_000)).toBeCloseTo(18, 5)
  })

  it('calcula custo de uma extração Haiku (1/5 por milhão)', () => {
    // 1M in + 1M out = 1 + 5 = 6
    expect(costUsd('claude-haiku-4-5', 1_000_000, 1_000_000)).toBeCloseTo(6, 5)
  })

  it('escala linearmente com a contagem de tokens', () => {
    // geração típica: 2k in, 800 out em Sonnet = 0.002*3 + 0.0008*15 = 0.006 + 0.012 = 0.018
    expect(costUsd('claude-sonnet-4-6', 2_000, 800)).toBeCloseTo(0.018, 6)
  })

  it('retorna 0 para um modelo sem preço conhecido (ex.: deepseek), sem quebrar', () => {
    expect(costUsd('deepseek-chat', 1_000_000, 1_000_000)).toBe(0)
  })

  it('trata zero tokens como custo zero', () => {
    expect(costUsd('claude-sonnet-4-6', 0, 0)).toBe(0)
  })
})
