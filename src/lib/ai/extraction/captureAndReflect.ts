import { getProvider } from '@/lib/ai/provider'
import { extractJSONBlock } from '@/lib/ai/extractJSON'
import { CAPTURE_SYSTEM_PROMPT, buildCaptureUserPrompt } from '@/lib/ai/extraction/prompts/capture'
import { validateCaptureResult } from '@/lib/ai/extraction/schemas'
import type { CaptureContext, Reflection } from '@/types/capture'
import type { EntrySource, ExtractedEntry } from '@/types/entry'

const MAX_TOKENS = 2048

/**
 * Extração + reflexo numa única chamada Haiku (Princípio III, D1 — minimiza custo e latência).
 * Saída sempre validada por Zod antes de retornar; quem chama não persiste nada parcial.
 */
export async function captureAndReflect(
  rawText: string,
  source: EntrySource,
  context: CaptureContext
): Promise<{ entries: ExtractedEntry[]; reflection: Reflection }> {
  const raw = await getProvider().complete({
    role: 'extraction',
    system: CAPTURE_SYSTEM_PROMPT,
    user: buildCaptureUserPrompt(rawText, source, context),
    maxTokens: MAX_TOKENS,
  })

  const json = extractJSONBlock(raw)
  return validateCaptureResult(json, source, rawText)
}
