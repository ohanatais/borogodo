const JSON_BLOCK_PATTERN = /```json\s*([\s\S]*?)\s*```/

/**
 * Extrai e parseia o bloco ```json ... ``` da resposta de um modelo.
 * Tolera variações de espaçamento/quebra de linha em volta das cercas (output de LLM varia).
 * Lança se não houver bloco — quem chama não persiste nada parcial.
 */
export function extractJSONBlock(text: string): unknown {
  const match = text.match(JSON_BLOCK_PATTERN)
  if (!match?.[1]) {
    throw new Error('JSON não encontrado na resposta do modelo')
  }

  return JSON.parse(match[1])
}
