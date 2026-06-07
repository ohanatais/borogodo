import { z } from 'zod'
import type { Reflection } from '@/types/capture'
import type { EntrySource, ExtractedEntry } from '@/types/entry'

const extractedEntrySchema = z.object({
  what_i_did: z.string().min(1),
  decision: z.string().nullish(),
  learning: z.string().nullish(),
  impact: z.string().nullish(),
  metric: z.string().nullish(),
  entry_date: z.string().nullish(),
  tags: z.array(z.string()).default([]),
  company: z.string().nullish(),
  role_title: z.string().nullish(),
  role_start: z.string().nullish(),
  role_end: z.string().nullish(),
})

const reflectionSchema = z.object({
  summary: z.string().min(1),
  pills: z.array(z.string()).min(1).max(4),
  move: z.object({
    type: z.enum(['question', 'affirmation', 'suggestion']),
    text: z.string().min(1),
    field: z.enum(['metric', 'impact', 'decision', 'learning']).optional(),
  }),
})

const captureResultSchema = z.object({
  entries: z.array(extractedEntrySchema).min(1),
  reflection: reflectionSchema,
})

function toExtractedEntry(
  raw: z.infer<typeof extractedEntrySchema>,
  rawContent: string,
  source: EntrySource
): ExtractedEntry {
  return { ...raw, raw_content: rawContent, source }
}

/**
 * Valida o JSON bruto retornado por `captureAndReflect` (extração + reflexo numa chamada).
 * Lança se o shape não bate com o esperado — quem chama não persiste nada parcial.
 */
export function validateCaptureResult(
  raw: unknown,
  source: EntrySource,
  rawContent = ''
): { entries: ExtractedEntry[]; reflection: Reflection } {
  const parsed = captureResultSchema.parse(raw)

  return {
    entries: parsed.entries.map((entry) => toExtractedEntry(entry, rawContent, source)),
    reflection: parsed.reflection,
  }
}

/**
 * Valida um lote de extração pura (sem reflexo), usado por `extractEntries`/`extractFromLinkedIn`.
 * Falha de qualquer item invalida o lote inteiro (MVP — sem persistência parcial).
 */
export function validateEntries(
  raw: unknown,
  source: EntrySource,
  maxEntries?: number,
  rawContent = ''
): ExtractedEntry[] {
  const parsed = z.array(extractedEntrySchema).min(1).parse(raw)
  const limited = maxEntries ? parsed.slice(0, maxEntries) : parsed

  return limited.map((entry) => toExtractedEntry(entry, rawContent, source))
}
