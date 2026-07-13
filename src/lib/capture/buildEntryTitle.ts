const MAX_TITLE_LENGTH = 80
const ELLIPSIS = '…'

/**
 * Heurística determinística de título (sem IA — research.md §3): primeira linha não-vazia do
 * texto cru, com `trim()`, truncada em 80 caracteres (mesmo limite do schema `entries.title`).
 * Corta na fronteira de palavra mais próxima quando precisa truncar, adicionando reticências só
 * nesse caso — nunca quando o texto já cabe inteiro.
 */
export function buildEntryTitle(rawText: string): string {
  const firstLine = findFirstNonEmptyLine(rawText)

  if (firstLine.length <= MAX_TITLE_LENGTH) {
    return firstLine
  }

  return truncateAtWordBoundary(firstLine, MAX_TITLE_LENGTH)
}

function findFirstNonEmptyLine(rawText: string): string {
  for (const line of rawText.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length > 0) return trimmed
  }
  return ''
}

function truncateAtWordBoundary(text: string, maxLength: number): string {
  const limit = maxLength - ELLIPSIS.length
  const sliced = text.slice(0, limit)
  const lastSpace = sliced.lastIndexOf(' ')
  const boundary = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced

  return `${boundary.trimEnd()}${ELLIPSIS}`
}
