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

describe('golden set — meta-regressão: o guardrail morde de fato', () => {
  // Prova que SE uma mudança de prompt degradar a saída (travessão, clichê de bio), o golden set
  // pega via `assert`. Pega um caso-ouro limpo, injeta a degradação e confirma que passa a violar.
  it('um corpo bom degradado com travessão passa a violar o assert 1', () => {
    const clean = goodCases[0].output.variants[0].body
    expect(validateContentRuleset(clean)).toEqual([]) // baseline limpo
    const degraded = `${clean} Entreguei tudo — no prazo.`
    expect(validateContentRuleset(degraded).map((v) => v.assert)).toContain(1)
  })

  it('uma mini-bio degradada com clichê de bio passa a violar o assert 10', () => {
    const miniBio = goodCases.find((c) => c.format === 'mini_bio')
    expect(miniBio).toBeDefined()
    const clean = miniBio!.output.variants[0].body
    expect(validateContentRuleset(clean)).toEqual([]) // baseline limpo
    const degraded = `${clean} Sou um profissional apaixonado por tecnologia.`
    expect(validateContentRuleset(degraded).map((v) => v.assert)).toContain(10)
  })
})

describe('golden set — cobertura do harness', () => {
  it('tem ao menos 12 casos bons cobrindo os 3 formatos (post, resumo, mini-bio)', () => {
    expect(goodCases.length).toBeGreaterThanOrEqual(12)
    expect(goodCases.some((c) => c.format === 'post')).toBe(true)
    expect(goodCases.some((c) => c.format === 'impact_summary')).toBe(true)
    expect(goodCases.some((c) => c.format === 'mini_bio')).toBe(true)
  })

  it('os casos ruins cobrem os 11 asserts (9 da 013 + clichê de bio da 015 + opinião-vazia da 018)', () => {
    const covered = new Set(badCases.map((c) => c.assert))
    for (let assert = 1; assert <= 11; assert++) {
      expect(covered.has(assert)).toBe(true)
    }
  })
})
