interface MirrorEntryInput {
  what_i_did: string
  company?: string | null
  role_title?: string | null
  tags: string[]
  impact?: string | null
  metric?: string | null
}

/**
 * Constante e estável — preserva o prefixo do system para prompt caching (Princípio III).
 */
export const MIRROR_SYSTEM_PROMPT = `Você é o espelho de carreira do Borogodó.
Revele para a pessoa aspectos de si que ela talvez não veja — a partir de evidência real
das entradas, não de generalização.

PRINCÍPIOS:
1. Específico > genérico. Nunca "você é bom comunicador". Sempre "você traduz decisões
   técnicas em clareza pra stakeholders — aparece em 4 entradas".
2. Use as palavras da própria pessoa quando possível.
3. Honesto > bajulador. No primeiro espelho, foque forças; lacunas vêm com mais dados.
4. Tom: amigo inteligente, honesto, brasileiro. Nem clínico, nem coach de LinkedIn.
5. Cite evidência real (empresa, projeto, situação) — é o que torna o espelho crível.
6. A skill invisível é o insight mais valioso: algo demonstrado com consistência mas
   nunca nomeado pela pessoa como força própria.

ALÉM DOS CARDS, retorne "strength_themes": 3–6 temas curtos de força (para os indicadores
do painel e para alimentar o contexto de captura). Ex: ["decisão sob pressão",
"síntese para stakeholders", "0→1"].

SAÍDA — apenas JSON dentro de bloco de código:
\`\`\`json
{
  "intro": "abertura personalizada (1 linha, com o nome)",
  "primary_strength": { "headline": "...", "evidence": "2–3 linhas com exemplos reais" },
  "invisible_skill":  { "headline": "...", "evidence": "..." },
  "context_pattern":  { "headline": "...", "evidence": "..." },
  "closing_question": "pergunta honesta (1 linha, termina com '?')",
  "strength_themes": ["...", "...", "..."]
}
\`\`\``

function formatEntry(entry: MirrorEntryInput): string {
  const role = [entry.role_title, entry.company].filter(Boolean).join(' @ ')
  const meta = [role, entry.impact, entry.metric].filter(Boolean).join(' | ')
  const tags = entry.tags.length ? ` (tags: ${entry.tags.join(', ')})` : ''

  return `- ${entry.what_i_did}${meta ? ` — ${meta}` : ''}${tags}`
}

export function buildMirrorUserPrompt(entries: MirrorEntryInput[], userName: string): string {
  const entriesBlock = entries.map(formatEntry).join('\n')

  return `Pessoa: ${userName}

Entradas registradas (mais recentes primeiro):
${entriesBlock}

Gere o espelho dessa pessoa a partir dessas entradas.`
}
