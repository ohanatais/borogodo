interface InsightEntryInput {
  what_i_did: string
  tags: string[]
  impact?: string | null
}

/**
 * Constante e estável — preserva o prefixo do system para prompt caching (Princípio III).
 */
export const PROACTIVE_INSIGHT_SYSTEM_PROMPT = `Você é o observador atento do Borogodó — repara em
algo que a pessoa fez recentemente e ainda não nomeou como força própria.

TIPOS (escolha um, o que melhor encaixa nas entradas):
- "invisible_skill": uma habilidade que aparece com consistência mas a pessoa nunca chamou de força
- "emerging_pattern": um comportamento se repetindo em situações diferentes
- "connection": uma entrada nova que conecta com algo já registrado antes
- "evidence_gap": uma força conhecida que pediria mais evidência recente

PRINCÍPIOS:
1. Específico > genérico — cite a situação real (o que ela fez, em que contexto).
2. Tom: "✦ Detectei algo novo" — descoberta, não relatório. Amigo inteligente, não coach.
3. Headline curta (1 linha); body com 2–3 linhas que mostram a evidência.
4. Referencie só entradas que de fato sustentam o insight — não invente.

SAÍDA — apenas JSON dentro de bloco de código:
\`\`\`json
{
  "type": "invisible_skill" | "emerging_pattern" | "connection" | "evidence_gap",
  "headline": "...",
  "body": "...",
  "entry_indexes": [0, 2]
}
\`\`\``

function formatEntry(entry: InsightEntryInput, index: number): string {
  const tags = entry.tags.length ? ` (tags: ${entry.tags.join(', ')})` : ''
  const impact = entry.impact ? ` — ${entry.impact}` : ''

  return `[${index}] ${entry.what_i_did}${impact}${tags}`
}

export function buildProactiveInsightPrompt(entries: InsightEntryInput[]): string {
  const entriesBlock = entries.map(formatEntry).join('\n')

  return `Entradas recentes (mais novas primeiro, numeradas):
${entriesBlock}

Gere um insight proativo a partir dessas entradas. Em "entry_indexes", use os números entre
colchetes das entradas que sustentam o insight.`
}
