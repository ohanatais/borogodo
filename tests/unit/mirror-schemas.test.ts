import { describe, it, expect } from 'vitest'
import { validateMirror } from '@/lib/ai/mirror/schemas'

const ev = (text: string) => ({ text, entry_ids: [] })

const validMirror = {
  intro: 'Já consigo ver algumas coisas, Ana.',
  primary_strength: {
    headline: 'Você traduz decisões técnicas em clareza pra stakeholders',
    evidence: ev('Aparece em 4 entradas, incluindo a migração do banco sob prazo apertado.'),
  },
  invisible_skill: {
    headline: 'Você estabiliza o time em momentos de incerteza',
    evidence: ev('Em 3 entradas, você foi quem segurou a comunicação durante a crise.'),
  },
  context_pattern: {
    headline: 'Você brilha em situações de 0 a 1',
    evidence: ev('Os relatos mais fortes são sempre de quando não havia processo definido.'),
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

  it('evidence com text e entry_ids é aceito corretamente', () => {
    const mirror = validateMirror({
      ...validMirror,
      primary_strength: {
        headline: 'Headline',
        evidence: { text: 'Evidência real.', entry_ids: ['uuid-1', 'uuid-2'] },
      },
    })
    expect(mirror.primary_strength.evidence.text).toBe('Evidência real.')
    expect(mirror.primary_strength.evidence.entry_ids).toEqual(['uuid-1', 'uuid-2'])
  })

  it('evidence sem entry_ids usa array vazio como default', () => {
    const mirror = validateMirror({
      ...validMirror,
      primary_strength: {
        headline: 'Headline',
        evidence: { text: 'Texto.' },
      },
    })
    expect(mirror.primary_strength.evidence.entry_ids).toEqual([])
  })

  it('aceita categories opcionais', () => {
    const mirror = validateMirror({
      ...validMirror,
      categories: [
        {
          name: 'Execução',
          skills: [{ name: 'Entrega sob pressão', tier: 'Comprovada', evidence_text: '...', entry_ids: [] }],
        },
      ],
    })
    expect(mirror.categories).toHaveLength(1)
    expect(mirror.categories?.[0]?.name).toBe('Execução')
  })

  it('aceita espelho sem categories (retrocompat)', () => {
    const mirror = validateMirror(validMirror)
    expect(mirror.categories).toEqual([])
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

  it('rejeita seções com headline vazio', () => {
    expect(() =>
      validateMirror({ ...validMirror, primary_strength: { headline: '', evidence: ev('algo') } })
    ).toThrow()
  })

  it('rejeita seções com evidence.text vazio', () => {
    expect(() =>
      validateMirror({
        ...validMirror,
        invisible_skill: { headline: 'algo', evidence: { text: '', entry_ids: [] } },
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
