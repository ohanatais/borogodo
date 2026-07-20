import type { createServerClient } from '@/lib/db/supabase/server'
import { logger } from '@/lib/log'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

interface HighlightTagsRow {
  tags: string[] | null
}

/**
 * Recalcula e persiste `entries.tags` como a união (sem duplicatas, ordenada) das tags de todos
 * os `entry_highlights` de uma fonte (feature 026) — mantém o rollup usado por
 * `getTagVocabulary`/o filtro de tags do feed sem precisar juntar `entry_highlights` a cada
 * leitura (ver data-model.md e research.md §4).
 *
 * Chamado sempre que um destaque é criado/editado/removido (organização automática ou manual).
 * Em erro de leitura, devolve array vazio sem lançar — quem chama (organizeEntry, rotas de
 * highlight) não deve quebrar por causa do rollup.
 */
export async function rollupEntryTags(
  supabase: SupabaseServerClient,
  entryId: string,
  userId?: string
): Promise<string[]> {
  const highlightsQuery = supabase.from('entry_highlights').select('tags').eq('entry_id', entryId)
  const { data, error } = await (userId ? highlightsQuery.eq('user_id', userId) : highlightsQuery)

  if (error || !data) return []

  const rows = data as HighlightTagsRow[]
  const allTags = rows.flatMap((row) => row.tags ?? [])
  const rollup = Array.from(new Set(allTags)).sort((a, b) => a.localeCompare(b))

  const entriesQuery = supabase.from('entries').update({ tags: rollup }).eq('id', entryId)
  const { error: updateError } = await (userId ? entriesQuery.eq('user_id', userId) : entriesQuery)

  if (updateError) {
    logger.error('rollup_entry_tags_persist_failed', { entryId })
  }

  return rollup
}
