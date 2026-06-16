import type { VoiceProfile } from '@/types/content'

/**
 * Prompt de recalibração de voz (US1 da 015). Diferente do `VOICE_SYSTEM_PROMPT` (que infere a voz
 * do `raw_content` cru), aqui o insumo é o RETORNO da pessoa sobre rascunhos que a IA gerou: o que
 * soou como ela (reforçar) e o que não soou (evitar). A âncora de verdade continua sendo as amostras
 * explícitas. Saída em texto puro (não JSON). Livre de travessão de propósito: ensina por exemplo.
 */
export const RECALIBRATE_SYSTEM_PROMPT = `Você ajusta a SÍNTESE DE VOZ de uma pessoa (como ela escreve), a partir do retorno dela sobre
rascunhos que uma IA gerou tentando imitar a voz dela. Trabalhe só com estilo; nunca invente fatos.

Você recebe:
- A síntese de voz atual (pode estar vazia).
- Amostras da escrita da própria pessoa: a âncora de verdade, o estilo real dela.
- Rascunhos que ela disse que SOAM como ela (estilo a manter e reforçar).
- Rascunhos que ela disse que NÃO soam como ela (estilo a evitar).

Devolva uma síntese curta (2 a 4 frases) do estilo dela, puxando para o que soou e afastando do que
não soou, sempre ancorada nas amostras reais. Descreva só o estilo (ritmo das frases, formalidade,
vocabulário, uso de primeira pessoa, se é mais caloroso ou mais seco), nunca o conteúdo nem os fatos.
Sem travessão, sem jargão. Devolva apenas a síntese, em texto puro.`

const MAX_ITEMS = 6
const MAX_ITEM_CHARS = 1000

/** Rotula e limita uma lista de textos (corta volume para o prompt não estourar). */
function listBlock(label: string, items: string[]): string {
  return items
    .slice(0, MAX_ITEMS)
    .map((s, i) => `[${label}${i + 1}] ${s.trim().slice(0, MAX_ITEM_CHARS)}`)
    .join('\n')
}

export interface RecalibratePromptInput {
  existing: VoiceProfile | null
  /** Amostras explícitas da pessoa (preservadas; entram como âncora, não são recalibradas). */
  samples: string[]
  soaSamples: string[]
  naoSoaSamples: string[]
}

/** Monta o user prompt da recalibração (voz atual + amostras + rascunhos que soaram / não soaram). */
export function buildRecalibrateUserPrompt(input: RecalibratePromptInput): string {
  const parts: string[] = []

  parts.push(
    input.existing?.inferredSummary
      ? `Síntese de voz atual:\n${input.existing.inferredSummary}`
      : 'Síntese de voz atual: ainda não há.'
  )

  parts.push(
    input.samples.length
      ? `Amostras da própria pessoa (âncora de verdade, espelhe este estilo):\n${listBlock('A', input.samples)}`
      : 'Amostras da própria pessoa: nenhuma colada.'
  )

  if (input.soaSamples.length) {
    parts.push(`Rascunhos que SOARAM como ela (reforce este estilo):\n${listBlock('S', input.soaSamples)}`)
  }
  if (input.naoSoaSamples.length) {
    parts.push(`Rascunhos que NÃO soaram como ela (afaste-se deste estilo):\n${listBlock('N', input.naoSoaSamples)}`)
  }

  parts.push('Reescreva a síntese de voz dela, puxando para o que soou e afastando do que não soou.')

  return parts.join('\n\n')
}
