import { z } from 'zod'
import { complete } from '@/lib/ai/client'
import { extractJSONBlock } from '@/lib/ai/extractJSON'

export interface SufficiencyEntry {
  what_i_did: string
  impact: string | null
  tags: string[]
}

const SufficiencySchema = z.discriminatedUnion('sufficient', [
  z.object({ sufficient: z.literal(true) }),
  z.object({
    sufficient: z.literal(false),
    follow_up_prompt: z.string().min(1).max(300),
  }),
])

export type SufficiencyResult = z.infer<typeof SufficiencySchema>

const SYSTEM_PROMPT = `Você é um avaliador que decide se um conjunto de entradas de carreira tem
conteúdo suficiente para gerar um espelho profissional significativo.

Retorne SOMENTE um JSON com este schema:
- Se suficiente: { "sufficient": true }
- Se não suficiente: { "sufficient": false, "follow_up_prompt": "<pergunta específica ao contexto, max 300 chars>" }

Critérios para "sufficient: true":
- Há pelo menos 1 entrada com what_i_did substancial (>30 palavras) OU impacto/métrica concreta
- As entradas revelam algum padrão ou especialidade detectável
- Há contexto suficiente para fazer ao menos 1 afirmação confiante sobre a pessoa

Quando "sufficient: false", o follow_up_prompt deve ser específico ao que foi dito — nunca genérico.
Exemplo ruim: "Me conta mais sobre você."
Exemplo bom: "Você mencionou liderar uma migração. Qual foi o resultado concreto? Um número ou mudança visível já basta."`

function buildUserPrompt(entries: SufficiencyEntry[]): string {
  const formatted = entries
    .map((e, i) => {
      const parts = [`[Entrada ${i + 1}]`, `O que fiz: ${e.what_i_did}`]
      if (e.impact) parts.push(`Impacto: ${e.impact}`)
      if (e.tags.length) parts.push(`Tags: ${e.tags.join(', ')}`)
      return parts.join('\n')
    })
    .join('\n\n')

  return `Entradas capturadas até agora:\n\n${formatted}\n\nEssas entradas são suficientes para gerar um espelho profissional significativo?`
}

export async function evaluateSufficiency(
  entries: SufficiencyEntry[],
  userId: string
): Promise<SufficiencyResult> {
  if (entries.length === 0) {
    return {
      sufficient: false,
      follow_up_prompt: 'Me conta a última coisa relevante que você fez no trabalho.',
    }
  }

  const raw = await complete({
    role: 'extraction',
    action: 'sufficiency',
    userId,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(entries),
    maxTokens: 512,
  })

  const json = extractJSONBlock(raw)
  return SufficiencySchema.parse(json)
}
