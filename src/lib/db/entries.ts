import type { createServerClient } from '@/lib/db/supabase/server'
import type { Entry, ExtractedEntry } from '@/types/entry'
import { generateEmbedding, cosineSimilarity, parseEmbedding } from '@/lib/ai/embeddings'
import { logger } from '@/lib/log'
import { errorMessage } from '@/lib/errors'

export interface EvidenceEntry {
  id: string
  what_i_did: string
  role_title: string | null
  company: string | null
  entry_date: string | null
  created_at: string
}

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

export const ENRICHABLE_FIELDS = ['metric', 'impact', 'decision', 'learning'] as const
export type EnrichableField = (typeof ENRICHABLE_FIELDS)[number]

const SEMANTIC_DEDUP_THRESHOLD = 0.92

async function isSemanticDuplicate(
  supabase: SupabaseServerClient,
  userId: string,
  entry: ExtractedEntry,
  embedding: number[]
): Promise<boolean> {
  if (!entry.company) return false

  let query = supabase
    .from('entries')
    .select('embedding')
    .eq('user_id', userId)
    .eq('company', entry.company)
    .not('embedding', 'is', null)

  if (entry.project_name != null) {
    query = query.eq('project_name', entry.project_name)
  } else {
    query = query.is('project_name', null)
  }

  const { data } = await query
  if (!data || data.length === 0) return false

  return data.some((row: { embedding: unknown }) => {
    const existing = parseEmbedding(row.embedding)
    if (!existing) return false
    return cosineSimilarity(embedding, existing) > SEMANTIC_DEDUP_THRESHOLD
  })
}

export async function saveEntries(
  supabase: SupabaseServerClient,
  userId: string,
  entries: ExtractedEntry[]
): Promise<Entry[]> {
  if (entries.length === 0) return []

  const { data: existing } = await supabase
    .from('entries')
    .select('what_i_did')
    .eq('user_id', userId)

  const existingTexts = new Set((existing ?? []).map((e: { what_i_did: string }) => e.what_i_did.trim()))

  const afterTextDedup = entries.filter((e) => !existingTexts.has(e.what_i_did.trim()))

  if (afterTextDedup.length === 0) return []

  const rowsWithEmbeddings: Array<ExtractedEntry & { user_id: string; embedding: number[] | null }> = []

  for (const entry of afterTextDedup) {
    let embedding: number[] | null = null

    if (entry.company) {
      try {
        embedding = await generateEmbedding(entry.what_i_did)
        const isDuplicate = await isSemanticDuplicate(supabase, userId, entry, embedding)
        if (isDuplicate) continue
      } catch (err) {
        logger.error('embedding generation failed — skipping semantic dedup', { message: errorMessage(err) })
      }
    }

    rowsWithEmbeddings.push({ ...entry, user_id: userId, embedding })
  }

  if (rowsWithEmbeddings.length === 0) return []

  const { data, error } = await supabase.from('entries').insert(rowsWithEmbeddings).select()

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

export async function getEntriesByIds(
  supabase: SupabaseServerClient,
  userId: string,
  ids: string[]
): Promise<EvidenceEntry[]> {
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('entries')
    .select('id, what_i_did, role_title, company, entry_date, created_at')
    .eq('user_id', userId)
    .in('id', ids)

  if (error || !data) {
    return []
  }

  return data as EvidenceEntry[]
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
