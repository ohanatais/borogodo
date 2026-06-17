import {
  ANTI_AI_DISCIPLINE,
  OUTPUT_CONTRACT,
  buildAdjustBlock,
  buildEvidenceBlock,
  buildVoiceBlock,
  type ContentPromptInput,
} from '@/lib/ai/content/prompts/discipline'

/**
 * System prompt da autoavaliação (US1 da 019). Herda a disciplina anti-IA do espelho (FR-008) e
 * estrutura o texto nas 4 seções nomeadas. "Pontos a desenvolver" ancora em sinal honesto/intenção
 * informada pela evidência: proibido inventar fraqueza para parecer humilde. Constante e estável —
 * preserva o prefixo para prompt caching.
 */
export const SELF_ASSESSMENT_SYSTEM_PROMPT = `Você escreve uma autoavaliação profissional na voz da pessoa, a partir do trabalho real que ela
registrou num período. É o texto que ela leva para um ciclo de avaliação ou uma conversa de carreira:
factual, ancorado em evidência, sem auto-bajulação e sem falsa modéstia.

${ANTI_AI_DISCIPLINE}

FORMATO AUTOAVALIAÇÃO:
- Estruture o body em quatro seções nomeadas, nesta ordem, com os rótulos literais:
  "Entregas:" o que a pessoa concluiu de fato no período (cite o rótulo [En] da evidência).
  "Impacto:" o efeito do que ela entregou (resultado, número com janela de tempo quando houver).
  "Evolução:" como ela cresceu (novo escopo, responsabilidade, repertório), sempre colado ao fato.
  "Pontos a desenvolver:" só o que a própria evidência sinaliza, ou uma intenção honesta de
  desenvolvimento. Proibido inventar fraqueza para parecer humilde, assim como é proibido inventar
  número ou fato.
- Base limitada não autoriza inventar: gere honesta, reconhecendo o que há no período.
- Cada uma das 2 variantes tem um enquadramento diferente (ex: "mais factual", "mais reflexiva"), mas
  ambas mantêm as quatro seções.
- Sem hashtag, sem call-to-action, sem emoji.

${OUTPUT_CONTRACT}`

/** Monta o user prompt da autoavaliação (período + evidência do intervalo + voz + enquadramento + ajuste). */
export function buildSelfAssessmentUserPrompt(input: ContentPromptInput): string {
  const angleLine = input.angle ? `\nEnquadramento desejado para uma das variantes: ${input.angle}` : ''

  return `Autoavaliação do período: ${input.seedSummary}

Evidência (o que a pessoa fez de fato no período; cada afirmação deve se apoiar numa destas, use o
rótulo [En] em evidence_refs):
${buildEvidenceBlock(input.evidence)}

${buildVoiceBlock(input.voiceProfile)}${angleLine}${buildAdjustBlock(input.adjust)}

Gere 2 variantes de autoavaliação a partir disso, cada uma com as quatro seções.`
}
