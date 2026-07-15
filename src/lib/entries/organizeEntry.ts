import { complete } from '@/lib/ai/client'
import { extractJSONBlock } from '@/lib/ai/extractJSON'
import { CAPTURE_ORGANIZE_SYSTEM_PROMPT, buildOrganizeUserPrompt } from '@/lib/ai/extraction/prompts/organize'
import { validateOrganizeResult, type OrganizeHighlight, type OrganizeResult } from '@/lib/ai/extraction/schemas'
import { getTagVocabulary } from '@/lib/entries/highlightVocabulary'
import { rollupEntryTags } from '@/lib/entries/rollupEntryTags'
import { logger } from '@/lib/log'
import type { createServerClient } from '@/lib/db/supabase/server'
import type { EntryHighlight } from '@/types/entry'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

const MAX_TOKENS = 2048

interface EntryRow {
  id: string
  user_id: string
  raw_content: string
  company: string | null
  entry_date: string | null
  is_personal_project: boolean
}

interface HighlightFieldsRow {
  title: string | null
  metric: string | null
  impact: string | null
  tags: string[] | null
}

export type OrganizeEntryOutcome =
  | {
      status: 'organized'
      highlights: EntryHighlight[]
      company: string | null
      is_personal_project: boolean
      entry_date: string | null
    }
  | { status: 'failed' }
  | { status: 'not_found' }

async function loadEntry(supabase: SupabaseServerClient, userId: string, entryId: string): Promise<EntryRow | null> {
  const { data, error } = await supabase
    .from('entries')
    .select('id, user_id, raw_content, company, entry_date, is_personal_project')
    .eq('id', entryId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  return data as EntryRow
}

async function loadExistingHighlights(supabase: SupabaseServerClient, entryId: string): Promise<HighlightFieldsRow[]> {
  const { data, error } = await supabase
    .from('entry_highlights')
    .select('title, metric, impact, tags')
    .eq('entry_id', entryId)
    .order('position', { ascending: true })

  if (error || !data) return []
  return data as HighlightFieldsRow[]
}

/**
 * Insere um destaque novo por resultado da IA — nunca sobrescreve um destaque já existente
 * (FR-002/FR-014): esta função só faz INSERT, jamais UPDATE em `entry_highlights`.
 */
async function insertNewHighlights(
  supabase: SupabaseServerClient,
  entryId: string,
  userId: string,
  startPosition: number,
  highlights: OrganizeHighlight[]
): Promise<EntryHighlight[]> {
  if (highlights.length === 0) return []

  const rows = highlights.map((highlight, index) => ({
    entry_id: entryId,
    user_id: userId,
    title: highlight.title,
    metric: highlight.metric,
    impact: highlight.impact,
    tags: highlight.tags,
    position: startPosition + index,
  }))

  const { data, error } = await supabase.from('entry_highlights').insert(rows).select()

  if (error || !data) {
    throw new Error('Falha ao persistir destaques da organização')
  }

  return data as EntryHighlight[]
}

interface ResolvedContextFields {
  company: string | null
  entryDate: string | null
}

/**
 * Única fonte de verdade da regra "só preenche vazios" (FR-002/FR-006) para `company`/`entry_date`
 * — usada tanto para decidir o que persistir quanto para montar a resposta, para as duas nunca
 * divergirem entre si.
 *
 * `is_personal_project = true` conta como contexto já resolvido manualmente (Story 2, FR-004) —
 * mesmo com `company` vazio, a IA nunca deve preencher uma empresa por cima da escolha de
 * "Projeto pessoal" (o prompt já pede `company: null` nesse caso, mas esta função é a garantia
 * de aplicação: nunca confiar cegamente no que a IA devolveu).
 */
function resolveContextFields(entryRow: EntryRow, result: OrganizeResult): ResolvedContextFields {
  return {
    company: entryRow.is_personal_project ? null : entryRow.company ?? result.company,
    entryDate: entryRow.entry_date ?? result.entry_date,
  }
}

/**
 * Preenche `company`/`entry_date` da fonte SÓ se ainda estiverem vazios (FR-002/FR-006) — nunca
 * sobrescreve um valor já resolvido manualmente (pílula de contexto ou edição direta).
 */
async function applyResolvedContextFields(
  supabase: SupabaseServerClient,
  entryId: string,
  userId: string,
  entryRow: EntryRow,
  resolved: ResolvedContextFields
): Promise<void> {
  const updates: Record<string, string> = {}
  if (entryRow.company === null && resolved.company !== null) updates.company = resolved.company
  if (entryRow.entry_date === null && resolved.entryDate !== null) updates.entry_date = resolved.entryDate

  if (Object.keys(updates).length === 0) return

  await supabase.from('entries').update(updates).eq('id', entryId).eq('user_id', userId)
}

async function clearOrganizingStartedAt(supabase: SupabaseServerClient, entryId: string, userId: string): Promise<void> {
  await supabase
    .from('entries')
    .update({ organizing_started_at: null })
    .eq('id', entryId)
    .eq('user_id', userId)
}

async function markOrganized(supabase: SupabaseServerClient, entryId: string, userId: string): Promise<void> {
  await supabase
    .from('entries')
    .update({ organized_at: new Date().toISOString(), organizing_started_at: null })
    .eq('id', entryId)
    .eq('user_id', userId)
}

/**
 * Núcleo de "Organizar" (US1, feature 026) — carrega a fonte, chama Haiku, valida e persiste só o
 * que ainda está vazio. Nunca lança: falha de IA/validação vira `{status:'failed'}` e limpa
 * `organizing_started_at`, permitindo nova tentativa (FR-030). Chamado tanto pelo clique manual
 * (`POST /organize`) quanto, futuramente, pelo disparo assíncrono (US3, fora do escopo desta fase).
 */
export async function organizeEntry(
  supabase: SupabaseServerClient,
  userId: string,
  entryId: string
): Promise<OrganizeEntryOutcome> {
  const entryRow = await loadEntry(supabase, userId, entryId)
  if (!entryRow) return { status: 'not_found' }

  try {
    const [existingHighlightRows, tagVocabulary] = await Promise.all([
      loadExistingHighlights(supabase, entryId),
      getTagVocabulary(supabase, userId),
    ])

    const existingHighlights: OrganizeHighlight[] = existingHighlightRows.map((row) => ({
      title: row.title,
      metric: row.metric,
      impact: row.impact,
      tags: row.tags ?? [],
    }))

    const prompt = buildOrganizeUserPrompt(entryRow.raw_content, {
      company: entryRow.company,
      isPersonalProject: entryRow.is_personal_project,
      entryDate: entryRow.entry_date,
      tagVocabulary,
      existingHighlights,
    })

    const raw = await complete({
      role: 'extraction',
      action: 'organize',
      userId,
      system: CAPTURE_ORGANIZE_SYSTEM_PROMPT,
      user: prompt,
      maxTokens: MAX_TOKENS,
    })

    const result = validateOrganizeResult(extractJSONBlock(raw))

    const insertedHighlights = await insertNewHighlights(
      supabase,
      entryId,
      userId,
      existingHighlights.length,
      result.highlights
    )

    const resolvedContext = resolveContextFields(entryRow, result)
    await applyResolvedContextFields(supabase, entryId, userId, entryRow, resolvedContext)
    await rollupEntryTags(supabase, entryId)
    await markOrganized(supabase, entryId, userId)

    return {
      status: 'organized',
      highlights: insertedHighlights,
      company: resolvedContext.company,
      is_personal_project: entryRow.is_personal_project,
      entry_date: resolvedContext.entryDate,
    }
  } catch (error: unknown) {
    logger.error('organize_entry_failed', {
      entryId,
      message: error instanceof Error ? error.message : 'unknown error',
    })
    await clearOrganizingStartedAt(supabase, entryId, userId)
    return { status: 'failed' }
  }
}
