import type { Mirror } from '@/types/mirror'

export interface RulesetViolation {
  assert: number
  field: string
  message: string
}

// Campos de texto plano inspecionados em cada assert (exceto strength_themes).
// Usa ?? '' para ser resiliente a mirrors malformados (ex: campo deletado em testes).
function textFields(m: Mirror): Array<[string, string]> {
  const raw = m as Record<string, unknown>
  const sec = (card: 'primary_strength' | 'invisible_skill' | 'context_pattern') =>
    (m[card] ?? {}) as { headline?: string; evidence?: string }
  return [
    ['intro', String(raw['intro'] ?? '')],
    ['primary_strength.headline', String(sec('primary_strength').headline ?? '')],
    ['primary_strength.evidence', String(sec('primary_strength').evidence ?? '')],
    ['invisible_skill.headline', String(sec('invisible_skill').headline ?? '')],
    ['invisible_skill.evidence', String(sec('invisible_skill').evidence ?? '')],
    ['context_pattern.headline', String(sec('context_pattern').headline ?? '')],
    ['context_pattern.evidence', String(sec('context_pattern').evidence ?? '')],
    ['closing', String(raw['closing'] ?? '')],
  ]
}

// Somente os 3 headlines de card (para assert 8).
// Usa ?. e ?? '' pelos mesmos motivos defensivos de textFields().
function cardHeadlines(m: Mirror): string[] {
  return [
    m.primary_strength?.headline ?? '',
    m.invisible_skill?.headline ?? '',
    m.context_pattern?.headline ?? '',
  ]
}

// Lista completa de buzzwords banidas (regras 2, 14 do prompt)
const BANNED_BUZZWORDS = [
  /data[-\s]driven/i,
  /orientad[ao]\s+a\s+resultados/i,
  /apaixonad[ao]/i,
  /transforma\s+ambiguidade/i,
  /proativ[ao]/i,
  /em\s+transi[çc][ãa]o/i,
  /destravar/i,
  /desbloquear\s+potencial/i,
  /mergulhar\s+fundo/i,
  /jornada\b/i,
  /no\s+fim\s+das\s+contas/i,
  /em\s+[uú]ltima\s+an[aá]lise/i,
  /vale\s+ressaltar/i,
  /[eé]\s+importante\s+notar/i,
  /mover\s+a\s+agulha/i,
  /ao\s+final\s+do\s+dia/i,
]

// Gírias de elogio proibidas (regra 11 do prompt)
const BANNED_SLANG = [
  /mandou\s+bem/i,
  /arrasou/i,
  /t[aá]\s+voando/i,
  /\bfera\b/i,
]

// Padrões de antítese proibida (regra 13 do prompt).
// Permissivos o suficiente para pegar frases multi-palavra antes da vírgula.
const ANTITHESIS_PATTERNS = [
  /deixou\s+de\s+ser/i,
  /n[ãa]o\s+[eé]\s+.{1,60}?,\s*[eé]\s/i,
  /mais\s+do\s+que\s+.{1,60}?,\s*[eé]\s/i,
]

// Detecta convite de métrica entre parênteses (ex: "se houver um número...")
const METRIC_INVITE_RE =
  /\((?:[^)]*(?:número|dado|m[eé]trica|queda|antes\/depois|frequência)[^)]*)\)/i

/**
 * Valida as 9 regras de qualidade do espelho honesto (006a) contra um Mirror já estruturado.
 * Roda sem chamar IA — puro string matching e regex sobre o JSON de saída.
 * Retorna array de violações; array vazio = espelho passa em tudo.
 */
export function validateMirrorRuleset(mirror: Mirror): RulesetViolation[] {
  const violations: RulesetViolation[] = []
  const fields = textFields(mirror)

  // Assert 1: sem travessão (—)
  for (const [field, text] of fields) {
    if (text.includes('—')) {
      violations.push({ assert: 1, field, message: `Campo "${field}" contém travessão (—)` })
    }
  }

  // Assert 2: sem buzzword banida
  for (const [field, text] of fields) {
    for (const pattern of BANNED_BUZZWORDS) {
      if (pattern.test(text)) {
        violations.push({
          assert: 2,
          field,
          message: `Campo "${field}" contém buzzword banida (${pattern.source})`,
        })
        break
      }
    }
  }

  // Assert 3: sem marcadores de skill ●○
  for (const [field, text] of fields) {
    if (text.includes('●') || text.includes('○')) {
      violations.push({ assert: 3, field, message: `Campo "${field}" contém marcador de skill (●○)` })
    }
  }

  // Assert 4: closing sem "?"
  if (mirror.closing?.includes('?')) {
    violations.push({ assert: 4, field: 'closing', message: 'closing contém ponto de interrogação (?)' })
  }

  // Assert 5: sem padrão de antítese
  for (const [field, text] of fields) {
    for (const pattern of ANTITHESIS_PATTERNS) {
      if (pattern.test(text)) {
        violations.push({
          assert: 5,
          field,
          message: `Campo "${field}" contém padrão de antítese banida (${pattern.source})`,
        })
        break
      }
    }
  }

  // Assert 6: sem gíria de elogio banida
  for (const [field, text] of fields) {
    for (const pattern of BANNED_SLANG) {
      if (pattern.test(text)) {
        violations.push({
          assert: 6,
          field,
          message: `Campo "${field}" contém gíria de elogio banida (${pattern.source})`,
        })
        break
      }
    }
  }

  // Assert 7: métrica-convite no máximo 1x no espelho inteiro.
  // Conta ocorrências totais (não campos) para pegar duplo-convite dentro do mesmo campo.
  const inviteFields: string[] = []
  let totalInvites = 0
  for (const [field, text] of fields) {
    const count = (text.match(new RegExp(METRIC_INVITE_RE.source, 'gi')) ?? []).length
    if (count > 0) {
      inviteFields.push(field)
      totalInvites += count
    }
  }
  if (totalInvites > 1) {
    violations.push({
      assert: 7,
      field: inviteFields.join(', '),
      message: `Convite de métrica aparece ${totalInvites}x (máximo: 1)`,
    })
  }

  // Assert 8: nem todos os headlines de card começam com "Você"
  const headlines = cardHeadlines(mirror)
  if (headlines.every((h) => h.trimStart().startsWith('Você'))) {
    violations.push({
      assert: 8,
      field: 'primary_strength.headline, invisible_skill.headline, context_pattern.headline',
      message: 'Todos os 3 headlines de card começam com "Você" — variar as aberturas',
    })
  }

  // Assert 9: closing existe e tem conteúdo; closing_question não deve existir
  const raw = mirror as Record<string, unknown>
  if (!mirror.closing || mirror.closing.trim() === '') {
    violations.push({ assert: 9, field: 'closing', message: 'Campo "closing" está vazio ou ausente' })
  }
  if ('closing_question' in raw) {
    violations.push({
      assert: 9,
      field: 'closing_question',
      message: 'Campo legado "closing_question" ainda presente — deve ser substituído por "closing"',
    })
  }

  return violations
}
