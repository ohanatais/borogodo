import type { createServerClient } from '@/lib/db/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

interface EntryTagsRow {
  tags: string[] | null
}

/**
 * Vocabulário de tags já usado pela pessoa (Story 6, feature 026) — reaproveitado no prompt de
 * "Organizar" para que uma tag nova nunca vire uma variação de uma já existente (FR-022/FR-023).
 *
 * Lê `entries.tags`, que é mantido como rollup sincronizado com `entry_highlights.tags`
 * (`rollupEntryTags`) — uma única query cobre tanto fontes organizadas (destaques) quanto
 * fontes legadas sem destaque (FR-032), sem precisar juntar `entry_highlights`.
 *
 * Em erro, devolve array vazio (o prompt segue sem vocabulário em vez de falhar a organização).
 */
export async function getTagVocabulary(
  supabase: SupabaseServerClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase.from('entries').select('tags').eq('user_id', userId)

  if (error || !data) return []

  const rows = data as EntryTagsRow[]
  const allTags = rows.flatMap((row) => row.tags ?? [])
  const distinctSorted = Array.from(new Set(allTags)).sort((a, b) => a.localeCompare(b))

  return distinctSorted
}
