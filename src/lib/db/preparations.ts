import type { createServerClient } from '@/lib/db/supabase/server'
import type { PrepMoment } from '@/lib/content/intentions'
import type { Preparation } from '@/types/preparation'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

const COLUMNS = 'id, moment, title, body, evidence_entry_ids, created_at'

interface PreparationRow {
  id: string
  moment: PrepMoment
  title: string
  body: string
  evidence_entry_ids: string[]
  created_at: string
}

function toPreparation(row: PreparationRow): Preparation {
  return {
    id: row.id,
    moment: row.moment,
    title: row.title,
    body: row.body,
    evidenceEntryIds: row.evidence_entry_ids,
    createdAt: row.created_at,
  }
}

export async function listPreparations(supabase: SupabaseServerClient, userId: string): Promise<Preparation[]> {
  const { data, error } = await supabase
    .from('preparations')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error || !data) return []
  return (data as PreparationRow[]).map(toPreparation)
}

export async function insertPreparation(
  supabase: SupabaseServerClient,
  userId: string,
  input: { moment: PrepMoment; body: string; evidenceEntryIds: string[]; title: string }
): Promise<Preparation> {
  if (input.evidenceEntryIds.length > 0) {
    const { data } = await supabase.from('entries').select('id').eq('user_id', userId).in('id', input.evidenceEntryIds)
    const owned = new Set((data ?? []).map((row) => row.id as string))
    input.evidenceEntryIds = input.evidenceEntryIds.filter((id) => owned.has(id))
  }
  const { data, error } = await supabase.from('preparations').insert({
    user_id: userId,
    moment: input.moment,
    title: input.title,
    body: input.body,
    evidence_entry_ids: input.evidenceEntryIds,
  }).select(COLUMNS).single()
  if (error || !data) throw new Error('persist_failed')
  return toPreparation(data as PreparationRow)
}

export async function deletePreparation(supabase: SupabaseServerClient, userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('preparations').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error('delete_failed')
}
