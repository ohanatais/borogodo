import {
  ANTI_AI_DISCIPLINE,
  OUTPUT_CONTRACT,
  buildAdjustBlock,
  buildAngleBlock,
  buildEvidenceBlock,
  buildVoiceBlock,
  type ContentPromptInput,
} from '@/lib/ai/content/prompts/discipline'

/**
 * System prompt do post de LinkedIn (T010). Herda a disciplina anti-IA do espelho (FR-009) e
 * adiciona o enquadramento do formato. Constante e estável — preserva o prefixo para prompt caching.
 */
export const POST_SYSTEM_PROMPT = `Você escreve o primeiro rascunho de um post de LinkedIn na voz da pessoa, a partir do trabalho
real que ela registrou. O post conta uma coisa concreta que ela fez: o processo, as decisões e
quem participou, sem auto-bajulação. Não é anúncio de release nem texto motivacional. O foco é o
processo e as pessoas, não "olha como eu sou incrível".

${ANTI_AI_DISCIPLINE}

FORMATO POST:
- Texto curto, pronto pra colar no LinkedIn. Abertura que fisga sem clickbait.
- Cada afirmação se apoia em uma evidência fornecida (cite o rótulo em evidence_refs).
- Cada uma das 2 variantes tem um ângulo diferente do mesmo fato (ex: "o aprendizado",
  "quem participou", "a decisão difícil"). Reflete a tese da marca: processo e pessoas.
- Sem hashtag, sem call-to-action de engajamento, sem emoji.

${OUTPUT_CONTRACT}`

/** Monta o user prompt do post (seed + evidência + voz + ângulo + ajuste). */
export function buildPostUserPrompt(input: ContentPromptInput): string {
  const angleLine = input.angle ? `\nÂngulo desejado para uma das variantes: ${input.angle}` : ''

  return `Baseado em: ${input.seedSummary}

Evidência (cada afirmação do post deve se apoiar em uma destas; use o rótulo [En] em evidence_refs):
${buildEvidenceBlock(input.evidence)}

${buildVoiceBlock(input.voiceProfile)}${angleLine}${buildAngleBlock(input)}${buildAdjustBlock(input.adjust)}

Gere 2 variantes de post de LinkedIn a partir disso.`
}
