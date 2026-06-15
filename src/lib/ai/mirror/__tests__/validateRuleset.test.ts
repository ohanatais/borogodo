import { describe, it, expect } from 'vitest'
import { validateMirrorRuleset } from '../validateRuleset'
import type { Mirror } from '@/types/mirror'

const BASE_MIRROR: Mirror = {
  intro: 'Intro.',
  primary_strength: {
    headline: 'Uma força real',
    evidence: { text: 'Evidência concreta de algo.', entry_ids: ['E1'] },
  },
  invisible_skill: {
    headline: 'Skill invisível',
    evidence: { text: 'Outra evidência com fato.', entry_ids: ['E2'] },
  },
  context_pattern: {
    headline: 'Padrão de contexto',
    evidence: { text: 'Terceira evidência com detalhe.', entry_ids: ['E3'] },
  },
  closing: 'Fechamento sem pergunta.',
  strength_themes: ['tema 1', 'tema 2'],
  categories: [],
}

function makeComprovadaSkill(evidence_text: string) {
  return {
    name: 'Entrega cross-functional',
    tier: 'Comprovada' as const,
    evidence_text,
    entry_ids: ['E1'],
  }
}

describe('validateMirrorRuleset — rule 10 (Comprovada evidence)', () => {
  it('violates rule 10 when evidence_text is empty', () => {
    const mirror: Mirror = {
      ...BASE_MIRROR,
      categories: [{ name: 'Execução', skills: [makeComprovadaSkill('')] }],
    }
    const violations = validateMirrorRuleset(mirror)
    const rule10 = violations.filter((v) => v.assert === 10)
    expect(rule10).toHaveLength(1)
    expect(rule10[0].message).toContain('Entrega cross-functional')
  })

  it('violates rule 10 when evidence_text is shorter than 20 chars', () => {
    const mirror: Mirror = {
      ...BASE_MIRROR,
      categories: [{ name: 'Execução', skills: [makeComprovadaSkill('bom')] }],
    }
    const violations = validateMirrorRuleset(mirror)
    const rule10 = violations.filter((v) => v.assert === 10)
    expect(rule10).toHaveLength(1)
  })

  it('does not violate rule 10 when evidence_text is substantive', () => {
    const mirror: Mirror = {
      ...BASE_MIRROR,
      categories: [
        {
          name: 'Execução',
          skills: [makeComprovadaSkill('ARR cresceu para $400K+ na Gestão DS')],
        },
      ],
    }
    const violations = validateMirrorRuleset(mirror)
    const rule10 = violations.filter((v) => v.assert === 10)
    expect(rule10).toHaveLength(0)
  })

  it('does not apply rule 10 to Emergente or Consistente tiers', () => {
    const mirror: Mirror = {
      ...BASE_MIRROR,
      categories: [
        {
          name: 'Execução',
          skills: [
            { name: 'Skill emergente', tier: 'Emergente', evidence_text: '', entry_ids: [] },
            { name: 'Skill consistente', tier: 'Consistente', evidence_text: 'curto', entry_ids: [] },
          ],
        },
      ],
    }
    const violations = validateMirrorRuleset(mirror)
    const rule10 = violations.filter((v) => v.assert === 10)
    expect(rule10).toHaveLength(0)
  })

  it('produces multiple violations when multiple Comprovada skills lack evidence', () => {
    const mirror: Mirror = {
      ...BASE_MIRROR,
      categories: [
        {
          name: 'Execução',
          skills: [
            { name: 'Skill A', tier: 'Comprovada', evidence_text: '', entry_ids: [] },
            { name: 'Skill B', tier: 'Comprovada', evidence_text: 'ok', entry_ids: [] },
          ],
        },
      ],
    }
    const violations = validateMirrorRuleset(mirror)
    const rule10 = violations.filter((v) => v.assert === 10)
    expect(rule10).toHaveLength(2)
  })

  it('returns no violations for a mirror with no categories', () => {
    const mirror: Mirror = { ...BASE_MIRROR, categories: [] }
    const violations = validateMirrorRuleset(mirror)
    const rule10 = violations.filter((v) => v.assert === 10)
    expect(rule10).toHaveLength(0)
  })
})
