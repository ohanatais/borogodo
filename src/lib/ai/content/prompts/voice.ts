/**
 * Prompt de inferência de voz (suporte ao T014). Analisa COMO a pessoa escreve (estilo), não o que
 * ela diz (conteúdo), para guiar a geração na voz dela. Saída em texto puro (não JSON).
 */
export const VOICE_SYSTEM_PROMPT = `Você analisa COMO uma pessoa escreve, não o que ela diz, para guiar uma IA a escrever na voz dela.

A partir dos textos crus dela, devolva uma síntese curta (2 a 4 frases) do estilo: ritmo das frases
(curtas ou longas), nível de formalidade, vocabulário típico, uso de primeira pessoa, se é mais
caloroso ou mais seco, e marcas pessoais de escrita.

Não resuma o conteúdo nem os fatos; descreva só o estilo. Sem travessão, sem jargão. Devolva apenas
a síntese, em texto puro.`

const MAX_RAW_CHARS = 6000

/** Monta o user prompt de inferência: textos crus das capturas + amostras coladas (se houver). */
export function buildVoiceUserPrompt(rawContents: string[], samples: string[]): string {
  const corpus = rawContents
    .map((c) => c.trim())
    .filter((c) => c.length > 0)
    .join('\n\n---\n\n')
    .slice(0, MAX_RAW_CHARS)

  const samplesBlock = samples.length
    ? `\n\nAmostras que a pessoa colou (peso maior para o estilo):\n${samples.map((s, i) => `[A${i + 1}] ${s}`).join('\n')}`
    : ''

  return `Textos da pessoa (use só para inferir o estilo de escrita):
${corpus || '(sem textos crus suficientes)'}${samplesBlock}

Descreva a voz dela.`
}
