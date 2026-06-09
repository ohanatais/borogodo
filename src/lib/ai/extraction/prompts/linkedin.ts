const RAW_TEXT_LIMIT = 8000

/**
 * Constante e estável (prompt caching) — extração pura de qualquer documento profissional.
 * Aceita currículos, portfólios, relatórios de desempenho, apresentações exportadas como
 * PDF, etc. Reusada pela feature 006 (onboarding).
 */
export const DOCUMENT_EXTRACTION_SYSTEM_PROMPT = `Você é a inteligência de extração do Borogodó. A pessoa importou um documento
profissional (currículo, LinkedIn export, relatório de desempenho, portfólio, etc.).

Transforme o conteúdo em uma ou mais entradas estruturadas, uma por experiência/realização
relevante. Campos disponíveis:
   what_i_did, decision, learning, impact, metric, entry_date, tags, company, role_title,
   role_start, role_end.
   - Preserve a VOZ da pessoa em "what_i_did" sempre que possível. Não reescreva em corporês.
   - tags = skills/temas concretos (não adjetivos genéricos).
   - Não invente o que não está no input.
   - Preencha apenas os campos que existem no documento; deixe null o que não existir.
   - Cada cargo ou realização relevante vira pelo menos uma entrada.
   - Datas sempre em YYYY-MM-DD; se só tiver mês/ano use o primeiro dia do mês.

SAÍDA — apenas JSON dentro de bloco de código, sem texto adicional:
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
export function buildDocumentExtractionPrompt(rawText: string): string {
  return `Conteúdo extraído do documento:\n---\n${rawText.slice(0, RAW_TEXT_LIMIT)}\n---`
}

/** @deprecated use DOCUMENT_EXTRACTION_SYSTEM_PROMPT */
export const LINKEDIN_SYSTEM_PROMPT = DOCUMENT_EXTRACTION_SYSTEM_PROMPT
/** @deprecated use buildDocumentExtractionPrompt */
export const buildLinkedInUserPrompt = buildDocumentExtractionPrompt
