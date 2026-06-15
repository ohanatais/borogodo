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
// Quantas entradas recentes (com embedding) entram no pool de comparação semântica por captura.
const DEDUP_COMPARE_LIMIT = 100

/**
 * Normaliza o texto para o dedup exato: minúsculas, espaços colapsados e sem pontuação. Faz "Saí de
 * zero GitHub..., " e "Saí de zero GitHub..." colidirem — capturas iguais a menos de formatação não
 * duplicam mais (não depende de embedding/IA).
 */
function normalizeForDedup(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,;:!?…"'`()[\]{}]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Pool de embeddings das entradas recentes do usuário (qualquer empresa) para o dedup semântico. */
async function loadRecentEmbeddings(supabase: SupabaseServerClient, userId: string): Promise<number[][]> {
  const { data } = await supabase
    .from('entries')
    .select('embedding')
    .eq('user_id', userId)
    .not('embedding', 'is', null)
    .order('created_at', { ascending: false })
    .limit(DEDUP_COMPARE_LIMIT)

  return (data ?? [])
    .map((row: { embedding: unknown }) => parseEmbedding(row.embedding))
    .filter((e: number[] | null): e is number[] => e !== null)
}

function isSemanticDuplicate(embedding: number[], pool: number[][]): boolean {
  return pool.some((existing) => cosineSimilarity(embedding, existing) > SEMANTIC_DEDUP_THRESHOLD)
}

/**
 * Persiste as entradas extraídas, deduplicando em três camadas (conserto: antes a dedup semântica só
 * rodava com empresa e o dedup exato exigia texto idêntico, então capturas iguais/parecidas de um
 * projeto próprio duplicavam):
 *   1. **Exato normalizado** — contra o que já existe e dentro do próprio lote (sem IA).
 *   2. **Semântico** — embedding comparado com as entradas recentes do usuário (qualquer empresa) e
 *      com as já aceitas neste lote; pulado com elegância se o embedding não estiver disponível.
 * Escopado por `user_id` (RLS reforça).
 */
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

  const seenTexts = new Set((existing ?? []).map((e: { what_i_did: string }) => normalizeForDedup(e.what_i_did)))

  let semanticPool: number[][] = []
  try {
    semanticPool = await loadRecentEmbeddings(supabase, userId)
  } catch (err) {
    logger.error('failed to load embeddings for semantic dedup', { message: errorMessage(err) })
  }

  const rowsWithEmbeddings: Array<ExtractedEntry & { user_id: string; embedding: number[] | null }> = []

  for (const entry of entries) {
    const normalized = normalizeForDedup(entry.what_i_did)
    if (seenTexts.has(normalized)) continue

    let embedding: number[] | null = null
    try {
      embedding = await generateEmbedding(entry.what_i_did)
      if (isSemanticDuplicate(embedding, semanticPool)) continue
    } catch (err) {
      logger.error('embedding generation failed — skipping semantic dedup', { message: errorMessage(err) })
    }

    rowsWithEmbeddings.push({ ...entry, user_id: userId, embedding })
    seenTexts.add(normalized)
    if (embedding) semanticPool.push(embedding)
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
