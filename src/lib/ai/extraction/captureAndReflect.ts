import { getProvider } from '@/lib/ai/provider'
import { CAPTURE_SYSTEM_PROMPT, buildCaptureUserPrompt } from '@/lib/ai/extraction/prompts/capture'
import { validateCaptureResult } from '@/lib/ai/extraction/schemas'
import type { CaptureContext, Reflection } from '@/types/capture'
import type { EntrySource, ExtractedEntry } from '@/types/entry'

const MAX_TOKENS = 2048
const JSON_BLOCK_PATTERN = /```json\n([\s\S]*?)\n```/

function extractJSONBlock(text: string): unknown {
  const match = text.match(JSON_BLOCK_PATTERN)
  if (!match?.[1]) {
    throw new Error('JSON não encontrado na resposta do modelo')
  }

  return JSON.parse(match[1])
}

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
