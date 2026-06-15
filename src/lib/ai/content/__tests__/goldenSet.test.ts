import { describe, it, expect } from 'vitest'
import { validateContentRuleset } from '../validateRuleset'
import { validateDraftOutput } from '../schemas'
import { goodCases, badCases } from './fixtures/goldenSet'

// Comprimento máximo de um body "curto" (heurística do golden set para length_pref).
const SHORT_MAX = 280

describe('golden set — casos bons', () => {
  for (const c of goodCases) {
    describe(c.name, () => {
      it('tem forma válida (exatamente 2 variantes) pelo schema do formato', () => {
        const raw = { variants: c.output.variants }
        expect(() => validateDraftOutput(raw, c.format)).not.toThrow()
      })

      it('passa no ruleset anti-IA com zero violações nas 2 variantes', () => {
        for (const v of c.output.variants) {
          expect(validateContentRuleset(v.body)).toEqual([])
        }
      })

      it('só cita evidência presente no seed (evidence_refs ⊆ seedLabels)', () => {
        const allowed = new Set(c.seedLabels)
        for (const v of c.output.variants) {
          for (const ref of v.evidence_refs) {
            expect(allowed.has(ref)).toBe(true)
          }
        }
      })

      if (c.lengthPref === 'curto') {
        it('respeita length_pref "curto"', () => {
          for (const v of c.output.variants) {
            expect(v.body.length).toBeLessThanOrEqual(SHORT_MAX)
          }
        })
      }
    })
  }
})

describe('golden set — casos ruins (o ruleset pega cada classe)', () => {
  for (const c of badCases) {
    it(`pega a violação do assert ${c.assert}: ${c.name}`, () => {
      const found = validateContentRuleset(c.body).map((v) => v.assert)
      expect(found).toContain(c.assert)
    })
  }
})

describe('golden set — cobertura do harness', () => {
  it('tem ao menos 12 casos bons cobrindo os 3 formatos (post, resumo, mini-bio)', () => {
    expect(goodCases.length).toBeGreaterThanOrEqual(12)
    expect(goodCases.some((c) => c.format === 'post')).toBe(true)
    expect(goodCases.some((c) => c.format === 'impact_summary')).toBe(true)
    expect(goodCases.some((c) => c.format === 'mini_bio')).toBe(true)
  })

  it('os casos ruins cobrem os 10 asserts (9 da 013 + clichê de bio da 015)', () => {
    const covered = new Set(badCases.map((c) => c.assert))
    for (let assert = 1; assert <= 10; assert++) {
      expect(covered.has(assert)).toBe(true)
    }
  })
})
