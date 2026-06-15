import { describe, it, expect } from 'vitest'
import { validateDraftOutput, postDraftSchema, impactSummaryDraftSchema } from '../schemas'

const VALID_RAW = {
  variants: [
    { angle: 'o aprendizado', body: 'Primeiro rascunho ancorado.', evidence_refs: ['E1'] },
    { angle: 'quem participou', body: 'Segundo rascunho ancorado.', evidence_refs: ['E2', 'E3'] },
  ],
}

describe('validateDraftOutput — forma válida', () => {
  it('aceita exatamente 2 variantes no formato post', () => {
    const parsed = validateDraftOutput(VALID_RAW, 'post')
    expect(parsed.variants).toHaveLength(2)
    expect(parsed.variants[0].evidence_refs).toEqual(['E1'])
  })

  it('aceita exatamente 2 variantes no formato impact_summary', () => {
    expect(validateDraftOutput(VALID_RAW, 'impact_summary').variants).toHaveLength(2)
  })

  it('faz default de evidence_refs para [] quando ausente', () => {
    const raw = {
      variants: [
        { angle: 'a', body: 'corpo um' },
        { angle: 'b', body: 'corpo dois' },
      ],
    }
    expect(validateDraftOutput(raw, 'post').variants[0].evidence_refs).toEqual([])
  })

  it('expõe os dois schemas nomeados', () => {
    expect(postDraftSchema.safeParse(VALID_RAW).success).toBe(true)
    expect(impactSummaryDraftSchema.safeParse(VALID_RAW).success).toBe(true)
  })
})

describe('validateDraftOutput — rejeição de malformado', () => {
  it('rejeita 1 variante (precisa de exatamente 2)', () => {
    expect(() => validateDraftOutput({ variants: [VALID_RAW.variants[0]] }, 'post')).toThrow()
  })

  it('rejeita 3 variantes', () => {
    const tres = { variants: [...VALID_RAW.variants, VALID_RAW.variants[0]] }
    expect(() => validateDraftOutput(tres, 'post')).toThrow()
  })

  it('rejeita body vazio', () => {
    const raw = {
      variants: [
        { angle: 'a', body: '', evidence_refs: [] },
        VALID_RAW.variants[1],
      ],
    }
    expect(() => validateDraftOutput(raw, 'post')).toThrow()
  })

  it('rejeita quando variants está ausente', () => {
    expect(() => validateDraftOutput({}, 'post')).toThrow()
  })

  it('rejeita entrada não-objeto', () => {
    expect(() => validateDraftOutput('não é json', 'post')).toThrow()
  })
})
