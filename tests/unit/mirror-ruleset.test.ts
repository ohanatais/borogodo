/**
 * Testes determinísticos da 006a — 9 asserts de qualidade do espelho honesto.
 * Rodam sem chamar IA: o output do Sonnet é mockado; os testes verificam o validador.
 *
 * RED até a implementação real de validateMirrorRuleset (stub retorna []).
 */
import { describe, it, expect } from 'vitest'
import { validateMirrorRuleset } from '@/lib/ai/mirror/validateRuleset'
import type { Mirror } from '@/types/mirror'

// Espelho limpo baseado no exemplo-ouro #1 (deve passar em todos os 9 asserts)
const GOLDEN_MIRROR: Mirror = {
  intro: 'Ana, já consigo ver o padrão.',
  primary_strength: {
    headline: 'PM que entra na camada de engenharia em vez de esperar alguém explicar',
    evidence:
      'Veio da Engenharia Química e lê log e API por conta própria. Cortou tempo de investigação dev em 50% na Vibe e levou esse instinto pra IA: 70% menos tempo de investigação técnica na Cheesecake Labs.',
  },
  invisible_skill: {
    headline: 'Chega onde não existe função de produto e monta uma do zero',
    evidence:
      'Em 3 das suas 4 casas você foi a primeira contratação de produto (Gestão DS) ou construiu o que faltava do zero (Vibe, Cheesecake). Esse padrão de 0→1 não é coincidência.',
  },
  context_pattern: {
    headline: 'Consultoria de produto em mercado regulado e multi-país',
    evidence:
      '9 produtos entregues, 3 países, do primeiro discovery ao pós-launch. Dois reviews 5★ no Clutch em squads multi-fuso: a prova de que o alinhamento funcionou é um cliente te avaliando, não você falando bem de você.',
  },
  closing:
    'Com o espelho tomando forma, o próximo passo é trazer mais entradas: cada nova conquista afina o que já aparesce aqui.',
  strength_themes: ['produto 0→1', 'fluência técnica', 'consultoria enterprise'],
}

// Helper: monta um espelho sobrescrevendo campos do golden
function mirror(overrides: Partial<Mirror>): Mirror {
  return { ...GOLDEN_MIRROR, ...overrides }
}

// Helper: monta um mirror com seções sobrescritas
function mirrorWithSection(
  card: 'primary_strength' | 'invisible_skill' | 'context_pattern',
  headline: string,
  evidence: string
): Mirror {
  return { ...GOLDEN_MIRROR, [card]: { headline, evidence } }
}

// Campos de texto plano do Mirror (exceto strength_themes)
function textFields(m: Mirror): Array<[string, string]> {
  return [
    ['intro', m.intro],
    ['primary_strength.headline', m.primary_strength.headline],
    ['primary_strength.evidence', m.primary_strength.evidence],
    ['invisible_skill.headline', m.invisible_skill.headline],
    ['invisible_skill.evidence', m.invisible_skill.evidence],
    ['context_pattern.headline', m.context_pattern.headline],
    ['context_pattern.evidence', m.context_pattern.evidence],
    ['closing', m.closing],
  ]
}

describe('validateMirrorRuleset — 9 asserts determinísticos', () => {
  // ─── Assert 1: sem travessão ─────────────────────────────────────────────
  describe('assert 1: sem travessão (—)', () => {
    it('espelho limpo não gera violação', () => {
      expect(validateMirrorRuleset(GOLDEN_MIRROR)).toEqual([])
    })

    it('travessão no intro gera violação com assert=1', () => {
      const m = mirror({ intro: 'Ana — consigo ver o padrão.' })
      const violations = validateMirrorRuleset(m)
      expect(violations.some((v) => v.assert === 1)).toBe(true)
    })

    it('travessão em headline de card gera violação', () => {
      const m = mirrorWithSection(
        'primary_strength',
        'PM que lê log — e entrega resultado',
        GOLDEN_MIRROR.primary_strength.evidence
      )
      const violations = validateMirrorRuleset(m)
      expect(violations.some((v) => v.assert === 1 && v.field === 'primary_strength.headline')).toBe(true)
    })

    it('travessão no closing gera violação', () => {
      const m = mirror({ closing: 'O espelho está tomando forma — traga mais entradas.' })
      const violations = validateMirrorRuleset(m)
      expect(violations.some((v) => v.assert === 1 && v.field === 'closing')).toBe(true)
    })
  })

  // ─── Assert 2: sem buzzword banida ───────────────────────────────────────
  describe('assert 2: sem buzzword banida', () => {
    const BANNED_CASES: Array<[string, string]> = [
      ['data-driven', 'PM data-driven orientada a resultado'],
      ['orientada a resultados', 'Profissional orientada a resultados'],
      ['apaixonada', 'Apaixonada por resolver problemas'],
      ['transforma ambiguidade', 'Transforma ambiguidade em entrega'],
      ['proativa', 'Pessoa proativa e colaborativa'],
      ['em transição', 'Profissional em transição de carreira'],
      ['destravar', 'Ajuda a destravar o time'],
      ['mergulhar fundo', 'Sabe mergulhar fundo nos problemas'],
      ['no fim das contas', 'No fim das contas, entrega bem'],
      ['em última análise', 'Em última análise, o que importa'],
      ['vale ressaltar', 'Vale ressaltar que ela entrega'],
      ['mover a agulha', 'Sabe mover a agulha nos projetos'],
    ]

    it('espelho limpo não gera violação de assert 2', () => {
      const violations = validateMirrorRuleset(GOLDEN_MIRROR)
      expect(violations.filter((v) => v.assert === 2)).toHaveLength(0)
    })

    BANNED_CASES.forEach(([buzzword, text]) => {
      it(`detecta buzzword "${buzzword}" no intro`, () => {
        const m = mirror({ intro: text })
        const violations = validateMirrorRuleset(m)
        expect(violations.some((v) => v.assert === 2)).toBe(true)
      })
    })
  })

  // ─── Assert 3: sem marcadores de skill (●○) ──────────────────────────────
  describe('assert 3: sem marcadores ●○', () => {
    it('espelho limpo não gera violação de assert 3', () => {
      expect(validateMirrorRuleset(GOLDEN_MIRROR).filter((v) => v.assert === 3)).toHaveLength(0)
    })

    it('● em evidence gera violação', () => {
      const m = mirrorWithSection(
        'invisible_skill',
        GOLDEN_MIRROR.invisible_skill.headline,
        'Nível: ●●●●○'
      )
      expect(validateMirrorRuleset(m).some((v) => v.assert === 3)).toBe(true)
    })

    it('○ em headline gera violação', () => {
      const m = mirrorWithSection(
        'context_pattern',
        'Força ○ em contextos regulados',
        GOLDEN_MIRROR.context_pattern.evidence
      )
      expect(validateMirrorRuleset(m).some((v) => v.assert === 3)).toBe(true)
    })
  })

  // ─── Assert 4: closing sem "?" ────────────────────────────────────────────
  describe('assert 4: closing sem ponto de interrogação', () => {
    it('espelho limpo não gera violação de assert 4', () => {
      expect(validateMirrorRuleset(GOLDEN_MIRROR).filter((v) => v.assert === 4)).toHaveLength(0)
    })

    it('closing com "?" gera violação', () => {
      const m = mirror({ closing: 'Isso ressoa com você?' })
      const violations = validateMirrorRuleset(m)
      expect(violations.some((v) => v.assert === 4 && v.field === 'closing')).toBe(true)
    })

    it('closing sem "?" não gera violação', () => {
      const m = mirror({ closing: 'Traga mais entradas e o espelho fica mais nítido.' })
      expect(validateMirrorRuleset(m).filter((v) => v.assert === 4)).toHaveLength(0)
    })
  })

  // ─── Assert 5: sem antítese ───────────────────────────────────────────────
  describe('assert 5: sem padrão de antítese', () => {
    it('espelho limpo não gera violação de assert 5', () => {
      expect(validateMirrorRuleset(GOLDEN_MIRROR).filter((v) => v.assert === 5)).toHaveLength(0)
    })

    it('"deixou de ser" gera violação', () => {
      const m = mirror({ intro: 'Você deixou de ser suporte e virou produto.' })
      expect(validateMirrorRuleset(m).some((v) => v.assert === 5)).toBe(true)
    })

    it('"não é X, é Y" gera violação', () => {
      const m = mirrorWithSection(
        'primary_strength',
        'Não é uma PM comum, é uma arquiteta de produto',
        GOLDEN_MIRROR.primary_strength.evidence
      )
      expect(validateMirrorRuleset(m).some((v) => v.assert === 5)).toBe(true)
    })

    it('"mais do que X, é Y" gera violação', () => {
      const m = mirrorWithSection(
        'invisible_skill',
        GOLDEN_MIRROR.invisible_skill.headline,
        'Mais do que executora, é uma estrategista.'
      )
      expect(validateMirrorRuleset(m).some((v) => v.assert === 5)).toBe(true)
    })
  })

  // ─── Assert 6: sem brasilidade boba ──────────────────────────────────────
  describe('assert 6: sem gíria de elogio banida', () => {
    it('espelho limpo não gera violação de assert 6', () => {
      expect(validateMirrorRuleset(GOLDEN_MIRROR).filter((v) => v.assert === 6)).toHaveLength(0)
    })

    it('"mandou bem" gera violação', () => {
      const m = mirror({ closing: 'Mandou bem nessa trajetória.' })
      expect(validateMirrorRuleset(m).some((v) => v.assert === 6)).toBe(true)
    })

    it('"arrasou" gera violação', () => {
      const m = mirror({ intro: 'Ana, você arrasou nos projetos.' })
      expect(validateMirrorRuleset(m).some((v) => v.assert === 6)).toBe(true)
    })

    it('"tá voando" gera violação', () => {
      const m = mirrorWithSection(
        'context_pattern',
        'Tá voando no mercado regulado',
        GOLDEN_MIRROR.context_pattern.evidence
      )
      expect(validateMirrorRuleset(m).some((v) => v.assert === 6)).toBe(true)
    })

    it('"fera" gera violação', () => {
      const m = mirror({ intro: 'Ana, você é uma fera em produto.' })
      expect(validateMirrorRuleset(m).some((v) => v.assert === 6)).toBe(true)
    })
  })

  // ─── Assert 7: métrica-convite no máximo 1x ──────────────────────────────
  describe('assert 7: métrica-convite aparece no máximo 1x', () => {
    it('espelho sem convite não gera violação', () => {
      expect(validateMirrorRuleset(GOLDEN_MIRROR).filter((v) => v.assert === 7)).toHaveLength(0)
    })

    it('um convite entre parênteses não gera violação', () => {
      const m = mirrorWithSection(
        'primary_strength',
        GOLDEN_MIRROR.primary_strength.headline,
        'Evidência qualitativa forte. (Se houver um número, como queda no retrabalho, fortalece.)'
      )
      expect(validateMirrorRuleset(m).filter((v) => v.assert === 7)).toHaveLength(0)
    })

    it('dois convites entre parênteses em campos diferentes gera violação', () => {
      const m: Mirror = {
        ...GOLDEN_MIRROR,
        primary_strength: {
          headline: GOLDEN_MIRROR.primary_strength.headline,
          evidence: 'Evidência. (Se tiver um número, fortalece.)',
        },
        invisible_skill: {
          headline: GOLDEN_MIRROR.invisible_skill.headline,
          evidence: 'Outra evidência. (Se lembrar de um dado, inclua.)',
        },
      }
      expect(validateMirrorRuleset(m).some((v) => v.assert === 7)).toBe(true)
    })
  })

  // ─── Assert 8: nem todos os headlines começam com "Você" ─────────────────
  describe('assert 8: variação de abertura nos headlines de card', () => {
    it('espelho limpo não gera violação (nem todos começam com Você)', () => {
      expect(validateMirrorRuleset(GOLDEN_MIRROR).filter((v) => v.assert === 8)).toHaveLength(0)
    })

    it('todos os 3 headlines começando com "Você" gera violação', () => {
      const m: Mirror = {
        ...GOLDEN_MIRROR,
        primary_strength: { headline: 'Você entrega rápido', evidence: 'evidência' },
        invisible_skill: { headline: 'Você estabiliza times', evidence: 'evidência' },
        context_pattern: { headline: 'Você brilha em 0→1', evidence: 'evidência' },
      }
      expect(validateMirrorRuleset(m).some((v) => v.assert === 8)).toBe(true)
    })

    it('apenas 2 dos 3 headlines começando com "Você" não gera violação', () => {
      const m: Mirror = {
        ...GOLDEN_MIRROR,
        primary_strength: { headline: 'Você entrega rápido', evidence: 'evidência' },
        invisible_skill: { headline: 'PM que estabiliza times', evidence: 'evidência' },
        context_pattern: { headline: 'Você brilha em 0→1', evidence: 'evidência' },
      }
      expect(validateMirrorRuleset(m).filter((v) => v.assert === 8)).toHaveLength(0)
    })
  })

  // ─── Assert 9: closing existe; closing_question não existe ───────────────
  describe('assert 9: shape do output (closing vs closing_question)', () => {
    it('espelho com closing e sem closing_question não gera violação', () => {
      expect(validateMirrorRuleset(GOLDEN_MIRROR).filter((v) => v.assert === 9)).toHaveLength(0)
    })

    it('objeto com closing_question (sem closing) gera violação', () => {
      const legacyMirror = {
        ...GOLDEN_MIRROR,
        closing_question: 'Isso ressoa com você?',
      } as unknown as Mirror & { closing_question?: string }
      delete (legacyMirror as unknown as { closing?: string }).closing
      const violations = validateMirrorRuleset(legacyMirror as Mirror)
      expect(violations.some((v) => v.assert === 9)).toBe(true)
    })

    it('objeto com closing vazio gera violação', () => {
      const m = mirror({ closing: '' })
      expect(validateMirrorRuleset(m).some((v) => v.assert === 9)).toBe(true)
    })
  })

  // ─── Espelho gold completo passa em tudo ─────────────────────────────────
  describe('golden mirror', () => {
    it('o espelho baseado no exemplo-ouro #1 passa em todos os 9 asserts', () => {
      const violations = validateMirrorRuleset(GOLDEN_MIRROR)
      expect(violations).toHaveLength(0)
    })
  })

  // ─── Campos inspecionados ─────────────────────────────────────────────────
  describe('cobertura de campos', () => {
    it('textFields helper cobre intro, 3 cards (headline+evidence) e closing', () => {
      // Verifica que o helper que usamos internamente está correto
      const fields = textFields(GOLDEN_MIRROR)
      expect(fields).toHaveLength(8)
      expect(fields.map(([k]) => k)).toContain('intro')
      expect(fields.map(([k]) => k)).toContain('closing')
    })
  })
})

