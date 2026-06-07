import { getProvider } from '@/lib/ai/provider'
import { LINKEDIN_SYSTEM_PROMPT, buildLinkedInUserPrompt } from '@/lib/ai/extraction/prompts/linkedin'
import { validateEntries } from '@/lib/ai/extraction/schemas'
import type { EntrySource, ExtractedEntry } from '@/types/entry'

const MAX_TOKENS = 4096
const JSON_BLOCK_PATTERN = /```json\n([\s\S]*?)\n```/

function extractEntriesArray(raw: string): unknown {
  const match = raw.match(JSON_BLOCK_PATTERN)
  if (!match?.[1]) {
    throw new Error('JSON não encontrado na resposta do modelo')
  }

  const parsed = JSON.parse(match[1]) as { entries?: unknown }
  if (!Array.isArray(parsed.entries)) {
    throw new Error('Formato inesperado: esperava { entries: [...] }')
  }

  return parsed.entries
}

/**
 * Extração pura (sem reflexo individual) — base reusada por `extractFromLinkedIn` (006).
 * Lote inteiro é invalidado se qualquer item falhar na validação Zod (MVP, sem persistência parcial).
 */
export async function extractEntries(rawText: string, source: EntrySource, maxEntries: number): Promise<ExtractedEntry[]> {
  const raw = await getProvider().complete({
    role: 'extraction',
    system: LINKEDIN_SYSTEM_PROMPT,
    user: buildLinkedInUserPrompt(rawText),
    maxTokens: MAX_TOKENS,
  })

  const entriesArray = extractEntriesArray(raw)
  return validateEntries(entriesArray, source, maxEntries, rawText)
}
