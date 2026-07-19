import { z } from 'zod'
import type { Reflection } from '@/types/capture'
import type { EntrySource, ExtractedEntry } from '@/types/entry'
import { NoExtractableContentError } from '@/lib/errors'

// PostgreSQL date columns require strict YYYY-MM-DD. LLMs often return partial dates
// ("2022-01" from LinkedIn, "2022" from résumés). Coerce to first-of-period so the
// DB insert never fails on a type mismatch.
function coerceDate(val: string | null | undefined): string | null {
  if (!val) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
  if (/^\d{4}-\d{2}$/.test(val)) return `${val}-01`
  if (/^\d{4}$/.test(val)) return `${val}-01-01`
  return null
}

const dateField = z
  .string()
  .nullish()
  .transform(coerceDate)

// LLMs sometimes return numeric values for free-text fields when the user mentions
// numbers (e.g. metric: 80000 instead of "80000"). Coerce to string so the DB
// insert doesn't fail on a type mismatch.
const textField = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v) => (v == null ? null : String(v)))

const extractedEntrySchema = z.object({
  what_i_did: z.string().min(1),
  title: z.string().max(80).optional().catch(undefined),
  decision: textField,
  learning: textField,
  impact: textField,
  metric: textField,
  entry_date: dateField,
  tags: z.array(z.string()).default([]),
  company: z.string().nullish(),
  role_title: z.string().nullish(),
  role_start: dateField,
  role_end: dateField,
})

const reflectionSchema = z.object({
  summary: z.string().min(1),
  pills: z.array(z.string()).max(4).default([]),
  move: z.object({
    type: z.enum(['question', 'affirmation', 'suggestion']),
    text: z.string().min(1),
    // .catch: LLMs sometimes return field names outside the enum (e.g. "feedback", "role").
    // Fall back to undefined rather than throwing, so the whole reflection isn't lost.
    field: z.enum(['metric', 'impact', 'decision', 'learning']).nullish().catch(undefined).transform(v => v ?? undefined),
  }),
})

const captureResultSchema = z.object({
  entries: z.array(extractedEntrySchema),
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

  if (parsed.entries.length === 0) {
    throw new NoExtractableContentError()
  }

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

// Feature 026-organizar-destaques (Story 6, FR-024): tags geradas por IA nunca são adjetivos
// genéricos isolados — a extração legada (`capture.ts`) só tinha essa regra no texto do prompt;
// aqui reforçamos com uma checagem de código, já que prompts podem falhar em seguir a instrução.
// Lista pequena e deliberadamente conservadora (advérbios/adjetivos de elogio vago, não termos
// técnicos) — nunca é exaustiva, é uma rede de segurança além do prompt (ver organize.ts).
const GENERIC_ADJECTIVE_TAGS = new Set([
  'importante',
  'difícil',
  'dificil',
  'produtivo',
  'proativo',
  'eficiente',
  'eficaz',
  'engajado',
  'dedicado',
  'excelente',
  'ótimo',
  'otimo',
  'bom',
  'rápido',
  'rapido',
  'criativo',
  'inovador',
  'estratégico',
  'estrategico',
])

// FR-023: uma tag nova MUST seguir formato consistente com as já existentes do vocabulário da
// pessoa — normalizamos casing/espaços em vez de confiar só na instrução de prompt, para que o
// vocabulário nunca divirja em capitalização por variação da IA entre chamadas.
function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase()
}

function isGenericAdjectiveTag(tag: string): boolean {
  return GENERIC_ADJECTIVE_TAGS.has(normalizeTag(tag))
}

function sanitizeOrganizeTags(tags: string[]): string[] {
  const normalized = tags.map(normalizeTag).filter((tag) => tag.length > 0 && !isGenericAdjectiveTag(tag))
  // Normalizar capitalização (FR-023) pode fazer duas tags distintas da IA colapsarem na mesma
  // string (ex. "DevOps" e "devops") — dedup depois de normalizar evita duplicata persistida.
  return Array.from(new Set(normalized))
}

// Feature 026-organizar-destaques: resultado da chamada de "Organizar" (Haiku). Ausência de
// métrica é válida (FR-018) — nenhum campo de highlight é obrigatório além de `tags`.
const organizeHighlightSchema = z.object({
  title: textField,
  metric: textField,
  impact: textField,
  tags: z.array(z.string()).default([]).transform(sanitizeOrganizeTags),
})

const organizeResultSchema = z.object({
  highlights: z.array(organizeHighlightSchema),
  company: z.string().nullish(),
  entry_date: dateField,
})

export interface OrganizeHighlight {
  title: string | null
  metric: string | null
  impact: string | null
  tags: string[]
}

export interface OrganizeResult {
  highlights: OrganizeHighlight[]
  company: string | null
  entry_date: string | null
}

/**
 * Valida o JSON bruto retornado pela chamada de "Organizar" (`organizeEntry`, feature 026).
 * Lança se o shape não bate — quem chama não persiste nada parcial (mesmo padrão de
 * `validateCaptureResult`/`validateEntries`).
 */
export function validateOrganizeResult(raw: unknown): OrganizeResult {
  const parsed = organizeResultSchema.parse(raw)

  return {
    highlights: parsed.highlights.map((h) => ({
      title: h.title ?? null,
      metric: h.metric ?? null,
      impact: h.impact ?? null,
      tags: h.tags,
    })),
    company: parsed.company ?? null,
    entry_date: parsed.entry_date,
  }
}
