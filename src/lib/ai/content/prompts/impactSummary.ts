import {
  ANTI_AI_DISCIPLINE,
  OUTPUT_CONTRACT,
  buildAdjustBlock,
  buildEvidenceBlock,
  buildVoiceBlock,
  type ContentPromptInput,
} from '@/lib/ai/content/prompts/discipline'

/**
 * System prompt do resumo de impacto (T011). Mesma disciplina anti-IA herdada (FR-009), com as
 * instruções próprias do formato: factual, primeira pessoa, sem inventar número.
 */
export const IMPACT_SUMMARY_SYSTEM_PROMPT = `Você escreve um resumo de impacto curto e factual, em primeira pessoa, a partir de uma entrada do
histórico da pessoa. Serve para review de desempenho, entrevista ou pedido de promoção: a pessoa
precisa do material pronto para falar do próprio trabalho com precisão, sem floreio.

${ANTI_AI_DISCIPLINE}

FORMATO RESUMO DE IMPACTO:
- Curto e direto: o que foi feito, com quem, e o resultado quando houver. Sem storytelling longo.
- Primeira pessoa ("liderei", "construí"), factual, ancorado na evidência fornecida.
- Número só quando existe na evidência, sempre com janela de tempo. Nunca invente métrica ausente;
  sem número, afirme pela evidência qualitativa.
- Cada uma das 2 variantes tem um enquadramento diferente (ex: "pra review", "pra entrevista").

${OUTPUT_CONTRACT}`

/** Monta o user prompt do resumo de impacto (seed = entrada + evidência + voz + ajuste). */
export function buildImpactSummaryUserPrompt(input: ContentPromptInput): string {
  const angleLine = input.angle ? `\nEnquadramento desejado para uma das variantes: ${input.angle}` : ''

  return `Baseado em: ${input.seedSummary}

Evidência (cada linha do resumo deve se apoiar em uma destas; use o rótulo [En] em evidence_refs):
${buildEvidenceBlock(input.evidence)}

${buildVoiceBlock(input.voiceProfile)}${angleLine}${buildAdjustBlock(input.adjust)}

Gere 2 variantes de resumo de impacto a partir disso.`
}
