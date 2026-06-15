import type { createServerClient } from '@/lib/db/supabase/server'
import type {
  Draft,
  DraftFormat,
  DraftStatus,
  LengthPref,
  SeedType,
  VoiceFeedback,
  VoiceProfile,
} from '@/types/content'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

// Colunas expostas à aplicação. `user_id`/`qa` não saem daqui (constituição I: id interno não vaza).
const DRAFT_COLUMNS = 'id, format, seed_type, seed_ref, angle, body, status, voice_feedback, created_at'

interface DraftRow {
  id: string
  format: DraftFormat
  seed_type: SeedType
  seed_ref: string | null
  angle: string
  body: string
  status: DraftStatus
  voice_feedback: VoiceFeedback | null
  created_at: string
}

function toDraft(row: DraftRow): Draft {
  return {
    id: row.id,
    format: row.format,
    seedType: row.seed_type,
    seedRef: row.seed_ref,
    angle: row.angle,
    body: row.body,
    status: row.status,
    voiceFeedback: row.voice_feedback,
    createdAt: row.created_at,
  }
}

const LENGTH_PREFS: readonly LengthPref[] = ['curto', 'medio', 'longo']

/** Mapeia o JSONB armazenado (snake_case) para o tipo de aplicação (camelCase). Resiliente a forma inválida. */
function toVoiceProfile(raw: unknown): VoiceProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>
  const lengthPref =
    typeof v.length_pref === 'string' && (LENGTH_PREFS as readonly string[]).includes(v.length_pref)
      ? (v.length_pref as LengthPref)
      : undefined
  return {
    tone: typeof v.tone === 'string' ? v.tone : undefined,
    lengthPref,
    samples: Array.isArray(v.samples) ? v.samples.filter((s): s is string => typeof s === 'string') : [],
    inferredSummary: typeof v.inferred_summary === 'string' ? v.inferred_summary : undefined,
    updatedAt: typeof v.updated_at === 'string' ? v.updated_at : '',
  }
}

export interface InsertDraftInput {
  format: DraftFormat
  seedType: SeedType
  seedRef: string | null
  angle: string
  body: string
  status: Extract<DraftStatus, 'generated' | 'edited'>
  qa: Record<string, unknown>
}

/** Persiste o rascunho escolhido. Escopado por `user_id` (RLS reforça); sem logar conteúdo. */
export async function insertDraft(
  supabase: SupabaseServerClient,
  userId: string,
  input: InsertDraftInput
): Promise<Draft> {
  const { data, error } = await supabase
    .from('drafts')
    .insert({
      user_id: userId,
      format: input.format,
      seed_type: input.seedType,
      seed_ref: input.seedRef,
      angle: input.angle,
      body: input.body,
      status: input.status,
      qa: input.qa,
    })
    .select(DRAFT_COLUMNS)
    .single()

  if (error || !data) {
    throw new Error('Não foi possível salvar o rascunho')
  }

  return toDraft(data as DraftRow)
}

/** Lista os rascunhos do usuário, mais recentes primeiro (usa o índice `drafts_user_created_idx`). */
export async function listDrafts(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 50
): Promise<Draft[]> {
  const { data, error } = await supabase
    .from('drafts')
    .select(DRAFT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as DraftRow[]).map(toDraft)
}

export interface UpdateDraftInput {
  body?: string
  status?: DraftStatus
  voiceFeedback?: VoiceFeedback
}

/**
 * Atualiza body/status/voiceFeedback de um rascunho do próprio usuário.
 * Filtra por `id` E `user_id`: um id de outro usuário retorna `null` (a rota mapeia 404, não 403).
 */
export async function updateDraft(
  supabase: SupabaseServerClient,
  userId: string,
  draftId: string,
  input: UpdateDraftInput
): Promise<Draft | null> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.body !== undefined) patch.body = input.body
  if (input.status !== undefined) patch.status = input.status
  if (input.voiceFeedback !== undefined) patch.voice_feedback = input.voiceFeedback

  const { data, error } = await supabase
    .from('drafts')
    .update(patch)
    .eq('id', draftId)
    .eq('user_id', userId)
    .select(DRAFT_COLUMNS)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return toDraft(data as DraftRow)
}

/** Lê o perfil de voz (JSONB em `profiles`) do usuário. `null` até a primeira inferência/calibração. */
export async function getVoiceProfile(
  supabase: SupabaseServerClient,
  userId: string
): Promise<VoiceProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('voice_profile')
    .eq('id', userId)
    .maybeSingle()

  return toVoiceProfile((data as { voice_profile?: unknown } | null)?.voice_profile)
}

/** Grava o perfil de voz, mapeando camelCase → JSONB snake_case (forma do data-model). */
export async function upsertVoiceProfile(
  supabase: SupabaseServerClient,
  userId: string,
  profile: VoiceProfile
): Promise<VoiceProfile> {
  const jsonb = {
    tone: profile.tone ?? null,
    length_pref: profile.lengthPref ?? null,
    samples: profile.samples,
    inferred_summary: profile.inferredSummary ?? null,
    updated_at: profile.updatedAt,
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ voice_profile: jsonb })
    .eq('id', userId)
    .select('voice_profile')
    .single()

  const saved = error ? null : toVoiceProfile((data as { voice_profile?: unknown } | null)?.voice_profile)
  if (!saved) {
    throw new Error('Não foi possível salvar o perfil de voz')
  }

  return saved
}
