import type { createServerClient } from '@/lib/db/supabase/server'
import type { Entry, ExtractedEntry } from '@/types/entry'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

export const ENRICHABLE_FIELDS = ['metric', 'impact', 'decision', 'learning'] as const
export type EnrichableField = (typeof ENRICHABLE_FIELDS)[number]

export async function saveEntries(
  supabase: SupabaseServerClient,
  userId: string,
  entries: ExtractedEntry[]
): Promise<Entry[]> {
  const rows = entries.map((entry) => ({ ...entry, user_id: userId }))
  const { data, error } = await supabase.from('entries').insert(rows).select()

  if (error || !data) {
    throw new Error('Não foi possível salvar a entrada')
  }

  return data as Entry[]
}

export async function getRecentEntries(
  supabase: SupabaseServerClient,
  userId: string,
  limit: number
): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data as Entry[]
}

export async function enrichEntryField(
  supabase: SupabaseServerClient,
  entryId: string,
  field: EnrichableField,
  answer: string
): Promise<Entry | null> {
  const { data, error } = await supabase
    .from('entries')
    .update({ [field]: answer, updated_at: new Date().toISOString() })
    .eq('id', entryId)
    .select()
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as Entry
}
