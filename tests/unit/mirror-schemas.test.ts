import { describe, it, expect } from 'vitest'
import { validateMirror } from '@/lib/ai/mirror/schemas'

const validMirror = {
  intro: 'Já consigo ver algumas coisas, Ana.',
  primary_strength: {
    headline: 'Você traduz decisões técnicas em clareza pra stakeholders',
    evidence: 'Aparece em 4 entradas, incluindo a migração do banco sob prazo apertado.',
  },
  invisible_skill: {
    headline: 'Você estabiliza o time em momentos de incerteza',
    evidence: 'Em 3 entradas, você foi quem segurou a comunicação durante a crise.',
  },
  context_pattern: {
    headline: 'Você brilha em situações de 0 a 1',
    evidence: 'Os relatos mais fortes são sempre de quando não havia processo definido.',
  },
  closing: 'Isso ressoa com você?',
  strength_themes: ['decisão sob pressão', 'síntese para stakeholders', '0→1'],
}

describe('validateMirror', () => {
  it('aceita um espelho com estrutura completa e 3-6 strength_themes', () => {
    const mirror = validateMirror(validMirror)

    expect(mirror.intro).toBe(validMirror.intro)
    expect(mirror.primary_strength.headline).toBe(validMirror.primary_strength.headline)
    expect(mirror.strength_themes).toHaveLength(3)
  })

  it('rejeita strength_themes com menos de 3 temas', () => {
    expect(() =>
      validateMirror({ ...validMirror, strength_themes: ['decisão sob pressão'] })
    ).toThrow()
  })

  it('rejeita strength_themes com mais de 6 temas', () => {
    expect(() =>
      validateMirror({ ...validMirror, strength_themes: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] })
    ).toThrow()
  })

  it('rejeita seções vazias (headline ou evidence em branco)', () => {
    expect(() =>
      validateMirror({ ...validMirror, primary_strength: { headline: '', evidence: 'algo' } })
    ).toThrow()

    expect(() =>
      validateMirror({
        ...validMirror,
        invisible_skill: { headline: 'algo', evidence: '' },
      })
    ).toThrow()
  })

  it('rejeita intro ou closing vazios', () => {
    expect(() => validateMirror({ ...validMirror, intro: '' })).toThrow()
    expect(() => validateMirror({ ...validMirror, closing: '' })).toThrow()
  })

  it('rejeita JSON malformado / shape inesperado', () => {
    expect(() => validateMirror({ foo: 'bar' })).toThrow()
    expect(() => validateMirror(null)).toThrow()
    expect(() => validateMirror('not an object')).toThrow()
  })
})
