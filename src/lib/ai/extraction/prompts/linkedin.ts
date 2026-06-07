const RAW_TEXT_LIMIT = 8000

/**
 * Constante e estável (prompt caching) — extração pura, sem reflexo. Usada pelo import
 * em lote (LinkedIn/currículo), reusada pela feature 006 (onboarding).
 */
export const LINKEDIN_SYSTEM_PROMPT = `Você é a inteligência de extração do Borogodó. A pessoa importou um arquivo
(ex.: PDF de currículo/LinkedIn) com seu histórico profissional.

Transforme o conteúdo em uma ou mais entradas estruturadas, uma por experiência/realização
relevante:
   what_i_did, decision, learning, impact, metric, entry_date, tags, company, role_title,
   role_start, role_end.
   - Preserve a VOZ da pessoa em "what_i_did" sempre que possível. Não reescreva em corporês.
   - tags = skills/temas concretos (não adjetivos genéricos).
   - Não invente o que não está no input.
   - Cada cargo/experiência relevante vira pelo menos uma entrada.

SAÍDA — apenas JSON dentro de bloco de código, sem reflexo:
\`\`\`json
{
  "entries": [
    {
      "what_i_did": "...",
      "decision": null,
      "learning": null,
      "impact": "...",
      "metric": null,
      "entry_date": "YYYY-MM-DD ou null",
      "tags": ["...", "..."],
      "company": "...",
      "role_title": "...",
      "role_start": "YYYY-MM-DD ou null",
      "role_end": "YYYY-MM-DD ou null"
    }
  ]
}
\`\`\``

/** Prompt do usuário para extração em lote — sem contexto pessoal (não há reflexo aqui). */
export function buildLinkedInUserPrompt(rawText: string): string {
  return `Conteúdo extraído do arquivo:\n---\n${rawText.slice(0, RAW_TEXT_LIMIT)}\n---`
}
