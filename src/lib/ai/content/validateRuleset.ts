import type { ContentRulesetViolation } from '@/types/content'
import {
  AI_JARGON,
  ANTITHESIS_PATTERNS,
  BANNED_BUZZWORDS,
  BIO_CLICHES,
  EMOJI_RE,
  EMPHASIS_ADVERBS,
  EMPTY_OPINION_TERMS,
  LINKEDIN_JARGON,
  METRIC_CHANGE_RE,
  PRAISE_SLANG,
  SILLY_BRAZILIANISM,
  TIME_WINDOW_RE,
} from '@/lib/ai/content/bannedTerms'

/** Empurra uma violação ao acionar o primeiro padrão da lista (uma por classe, não por termo). */
function checkPatterns(
  text: string,
  patterns: readonly RegExp[],
  assert: number,
  field: string,
  describe: (pattern: RegExp) => string,
  violations: ContentRulesetViolation[]
): void {
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      violations.push({ assert, field, message: describe(pattern) })
      return
    }
  }
}

/**
 * Valida o `body` de uma variante contra as 10 regras anti-IA da Geração de Conteúdo
 * (9 da 013 + assert 10 anti-clichê de bio da 015).
 * Determinístico, sem chamar IA — puro string matching e regex (espelha `validateMirrorRuleset`).
 * Retorna array de violações; vazio = passa. Resiliente a entrada vazia (não lança).
 */
export function validateContentRuleset(text: string, field = 'body'): ContentRulesetViolation[] {
  const violations: ContentRulesetViolation[] = []
  if (!text) return violations

  // Assert 1: sem travessão (—)
  if (text.includes('—')) {
    violations.push({ assert: 1, field, message: `"${field}" contém travessão (—)` })
  }

  // Assert 2: sem buzzword banida
  checkPatterns(text, BANNED_BUZZWORDS, 2, field, (p) => `"${field}" contém buzzword banida (${p.source})`, violations)

  // Assert 3: sem padrão de antítese
  checkPatterns(text, ANTITHESIS_PATTERNS, 3, field, (p) => `"${field}" contém antítese banida (${p.source})`, violations)

  // Assert 4: sem advérbio de ênfase vazio
  checkPatterns(text, EMPHASIS_ADVERBS, 4, field, (p) => `"${field}" contém advérbio de ênfase vazio (${p.source})`, violations)

  // Assert 5: sem jargão de IA / tradução do inglês
  checkPatterns(text, AI_JARGON, 5, field, (p) => `"${field}" contém jargão de IA (${p.source})`, violations)

  // Assert 6: sem jargão vazio de LinkedIn
  checkPatterns(text, LINKEDIN_JARGON, 6, field, (p) => `"${field}" contém jargão de LinkedIn (${p.source})`, violations)

  // Assert 7: métrica de mudança sempre com janela de tempo
  if (METRIC_CHANGE_RE.test(text) && !TIME_WINDOW_RE.test(text)) {
    violations.push({ assert: 7, field, message: `"${field}" tem métrica de mudança sem janela de tempo` })
  }

  // Assert 8: sem gíria de elogio
  checkPatterns(text, PRAISE_SLANG, 8, field, (p) => `"${field}" contém gíria de elogio (${p.source})`, violations)

  // Assert 9: sem brasilidade boba (emoji, metáfora, diminutivo fofo)
  if (EMOJI_RE.test(text)) {
    violations.push({ assert: 9, field, message: `"${field}" contém emoji decorativo` })
  } else {
    checkPatterns(text, SILLY_BRAZILIANISM, 9, field, (p) => `"${field}" contém brasilidade boba (${p.source})`, violations)
  }

  // Assert 10 (015): sem clichê de bio (apaixonado por tecnologia, movido a desafios, etc.)
  checkPatterns(text, BIO_CLICHES, 10, field, (p) => `"${field}" contém clichê de bio (${p.source})`, violations)

  // Assert 11 (018): sem jargão de opinião-vazia
  checkPatterns(text, EMPTY_OPINION_TERMS, 11, field, (p) => `"${field}" contém jargão de opinião-vazia (${p.source})`, violations)

  return violations
}
