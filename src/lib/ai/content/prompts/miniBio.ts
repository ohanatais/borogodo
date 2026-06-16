import {
  ANTI_AI_DISCIPLINE,
  OUTPUT_CONTRACT,
  buildAdjustBlock,
  buildEvidenceBlock,
  buildVoiceBlock,
  type ContentPromptInput,
} from '@/lib/ai/content/prompts/discipline'

/**
 * Regra anti-clichê de bio, no prompt (espelha o assert 10 do ruleset). Bio é o formato onde o clichê
 * é mais forte e mais datado; sem a regra, a mini-bio soa genérica, exatamente o que o produto evita.
 */
const ANTI_BIO_CLICHE = `CLICHÊ DE BIO (proibido): nada de "apaixonado por tecnologia", "movido a desafios", "transformando
ideias em realidade", "profissional dedicado", "entusiasta de", "em busca de novos desafios", "paixão
por". Diga o que a pessoa FAZ e FEZ, concreto, nunca o que ela "é apaixonada por" ou "movida a".`

/**
 * System prompt da mini-bio (US3 da 015). Herda a disciplina anti-IA do espelho (FR-008) e adiciona o
 * enquadramento do formato mais a regra anti-clichê de bio. Constante e estável — preserva o prefixo
 * para prompt caching.
 */
export const MINI_BIO_SYSTEM_PROMPT = `Você escreve uma mini-bio profissional curta na voz da pessoa, para o topo de um perfil de LinkedIn,
uma assinatura ou um "sobre mim". A partir do trabalho real que ela registrou, diga em poucas linhas
quem ela é profissionalmente: o que faz, a trajetória em uma pincelada, e o que a torna concreta. Sem
auto-bajulação, sem manifesto, sem lista de qualidades.

${ANTI_AI_DISCIPLINE}

${ANTI_BIO_CLICHE}

FORMATO MINI-BIO:
- Curta e factual: 2 a 4 frases. Cabe no topo de um perfil. Sem storytelling longo.
- Ancorada no que a pessoa fez de fato (cite o rótulo em evidence_refs quando a frase se apoia numa
  evidência). Base limitada não autoriza inventar: gere curta e honesta, reconhecendo o que há.
- Cada uma das 2 variantes tem um enquadramento diferente (ex: "mais direta", "mais narrativa").
- Sem hashtag, sem call-to-action de engajamento, sem emoji.

${OUTPUT_CONTRACT}`

/** Monta o user prompt da mini-bio (seed + evidência ampla + voz + enquadramento + ajuste). */
export function buildMiniBioUserPrompt(input: ContentPromptInput): string {
  const angleLine = input.angle ? `\nEnquadramento desejado para uma das variantes: ${input.angle}` : ''

  return `Baseado em: ${input.seedSummary}

Evidência (o que a pessoa fez de fato; cada afirmação da bio deve se apoiar numa destas, use o rótulo
[En] em evidence_refs):
${buildEvidenceBlock(input.evidence)}

${buildVoiceBlock(input.voiceProfile)}${angleLine}${buildAdjustBlock(input.adjust)}

Gere 2 variantes de mini-bio profissional a partir disso.`
}
