import type { createServerClient } from '@/lib/db/supabase/server'
import { getLatestSnapshot } from '@/lib/db/mirror'
import type { EvidenceItem } from '@/lib/ai/content/prompts/discipline'
import type { SeedType } from '@/types/content'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

const MAX_THEME_EVIDENCE = 12

export interface SeedEvidence {
  seedSummary: string
  evidence: EvidenceItem[]
}

interface EntryEvidenceRow {
  what_i_did: string
  company: string | null
  role_title: string | null
  impact: string | null
  metric: string | null
}

/** Condensa uma entrada num texto de evidência (mesmo espírito do formatEntry do espelho). */
function formatEntryEvidence(e: EntryEvidenceRow): string {
  const role = [e.role_title, e.company].filter(Boolean).join(' @ ')
  const meta = [role, e.impact, e.metric].filter(Boolean).join(' | ')
  return meta ? `${e.what_i_did}: ${meta}` : e.what_i_did
}

const ENTRY_EVIDENCE_COLUMNS = 'id, what_i_did, company, role_title, impact, metric'

/** Carrega as entradas recentes do usuário como pool de evidência rotulada (E1..En). */
async function loadRecentEntries(
  supabase: SupabaseServerClient,
  userId: string
): Promise<EvidenceItem[]> {
  const { data } = await supabase
    .from('entries')
    .select(ENTRY_EVIDENCE_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_THEME_EVIDENCE)

  return (data ?? []).map((e, i) => ({ label: `E${i + 1}`, text: formatEntryEvidence(e as EntryEvidenceRow) }))
}

/** Tema do espelho: confirma que o tema é do usuário (está no snapshot dele) e usa as entradas como evidência. */
async function loadThemeSeed(
  supabase: SupabaseServerClient,
  userId: string,
  theme: string
): Promise<SeedEvidence | null> {
  const snapshot = await getLatestSnapshot(supabase, userId)
  if (!snapshot || !snapshot.strength_themes?.includes(theme)) {
    return null
  }

  return { seedSummary: theme, evidence: await loadRecentEntries(supabase, userId) }
}

/** Entrada específica: confirma que a entrada é do usuário e a usa como evidência única. */
async function loadEntrySeed(
  supabase: SupabaseServerClient,
  userId: string,
  entryId: string
): Promise<SeedEvidence | null> {
  const { data } = await supabase
    .from('entries')
    .select(ENTRY_EVIDENCE_COLUMNS)
    .eq('user_id', userId)
    .eq('id', entryId)
    .maybeSingle()

  if (!data) return null

  const row = data as EntryEvidenceRow
  return { seedSummary: row.what_i_did, evidence: [{ label: 'E1', text: formatEntryEvidence(row) }] }
}

/**
 * Carrega a evidência de um seed, sempre escopada ao usuário (constituição I: seedRef validado como
 * dele antes de qualquer chamada ao LLM). Retorna `null` quando o seed não é do usuário / não existe
 * (a rota mapeia 404). `project` não tem ponto de entrada na 013.
 */
export async function loadSeedEvidence(
  supabase: SupabaseServerClient,
  userId: string,
  seedType: SeedType,
  seedRef: string
): Promise<SeedEvidence | null> {
  if (seedType === 'theme') return loadThemeSeed(supabase, userId, seedRef)
  if (seedType === 'entry') return loadEntrySeed(supabase, userId, seedRef)
  return null
}
