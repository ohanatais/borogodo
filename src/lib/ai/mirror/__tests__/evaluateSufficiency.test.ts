import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockComplete = vi.hoisted(() => vi.fn())

// O guard (`client.complete`) é o ponto por onde a função passa agora (023). Mockamos ele direto.
vi.mock('@/lib/ai/client', () => ({
  complete: mockComplete,
}))

import { evaluateSufficiency } from '../evaluateSufficiency'

describe('evaluateSufficiency', () => {
  beforeEach(() => {
    mockComplete.mockReset()
  })

  it('returns sufficient: false with prompt for empty entries', async () => {
    const result = await evaluateSufficiency([], 'u1')
    expect(result.sufficient).toBe(false)
    if (!result.sufficient) {
      expect(result.follow_up_prompt).toBeTruthy()
    }
  })

  it('returns sufficient: true when LLM says so', async () => {
    mockComplete.mockResolvedValue('```json\n{"sufficient": true}\n```')
    const result = await evaluateSufficiency([
      { what_i_did: 'Liderou a migração de um sistema crítico que reduziu erros em 40%', impact: '40% fewer errors', tags: ['liderança'] },
    ], 'u1')
    expect(result.sufficient).toBe(true)
  })

  it('returns follow_up_prompt when LLM says not sufficient', async () => {
    mockComplete.mockResolvedValue('```json\n{"sufficient": false, "follow_up_prompt": "Qual foi o resultado concreto?"}\n```')
    const result = await evaluateSufficiency([
      { what_i_did: 'Fiz algo', impact: null, tags: [] },
    ], 'u1')
    expect(result.sufficient).toBe(false)
    if (!result.sufficient) {
      expect(result.follow_up_prompt).toBe('Qual foi o resultado concreto?')
    }
  })

  it('throws if LLM returns invalid JSON shape', async () => {
    mockComplete.mockResolvedValue('```json\n{"invalid": true}\n```')
    await expect(
      evaluateSufficiency([{ what_i_did: 'Algo', impact: null, tags: [] }], 'u1')
    ).rejects.toThrow()
  })
})
