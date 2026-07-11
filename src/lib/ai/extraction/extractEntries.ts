import { complete } from '@/lib/ai/client'
import { extractJSONBlock } from '@/lib/ai/extractJSON'
import { DOCUMENT_EXTRACTION_SYSTEM_PROMPT, buildDocumentExtractionPrompt } from '@/lib/ai/extraction/prompts/linkedin'
import { validateEntries } from '@/lib/ai/extraction/schemas'
import type { EntrySource, ExtractedEntry } from '@/types/entry'

const MAX_TOKENS = 4096

function extractEntriesArray(raw: string): unknown {
  const parsed = extractJSONBlock(raw) as { entries?: unknown }
  if (!Array.isArray(parsed.entries)) {
    throw new Error('Formato inesperado: esperava { entries: [...] }')
  }

  return parsed.entries
}

/**
 * Extração pura (sem reflexo individual) — base reusada por `extractFromLinkedIn` (006).
 * Lote inteiro é invalidado se qualquer item falhar na validação Zod (MVP, sem persistência parcial).
 */
export async function extractEntries(rawText: string, source: EntrySource, maxEntries: number, userId: string): Promise<ExtractedEntry[]> {
  const raw = await complete({
    role: 'extraction',
    action: 'capture',
    userId,
    system: DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
    user: buildDocumentExtractionPrompt(rawText),
    maxTokens: MAX_TOKENS,
  })

  const entriesArray = extractEntriesArray(raw)
  return validateEntries(entriesArray, source, maxEntries, rawText)
}
