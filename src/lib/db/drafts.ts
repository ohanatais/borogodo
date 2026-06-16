import type { createServerClient } from '@/lib/db/supabase/server'
import type {
  Draft,
  DraftFormat,
  DraftListPage,
  DraftStatus,
  DraftStatusFilter,
  LengthPref,
  SeedType,
  VoiceFeedback,
  VoiceProfile,
  VoiceSignal,
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

/** Opções de listagem do hub (014): paginação por cursor + filtro de status/formato. */
export interface ListDraftsOptions {
  /** Cursor opaco (created_at do último item da página anterior). */
  cursor?: string
  /** Itens por página; com teto rígido (`MAX_DRAFTS_PAGE`) para nunca abrir query ilimitada. */
  limit?: number
  /** Recorte por status; `ativos` (default) exclui os arquivados. */
  status?: DraftStatusFilter
  /** Recorte por formato (post/resumo); sem filtro quando ausente. */
  format?: DraftFormat
}

const DEFAULT_DRAFTS_PAGE = 20
const MAX_DRAFTS_PAGE = 20

function clampLimit(limit: number | undefined): number {
  if (!limit || limit < 1) return DEFAULT_DRAFTS_PAGE
  return Math.min(limit, MAX_DRAFTS_PAGE)
}

/**
 * Lista paginada dos rascunhos do usuário, mais recentes primeiro (índice `drafts_user_created_idx`).
 * Keyset por `created_at`: pede `limit + 1` para saber se há próxima página sem um count à parte.
 * Por padrão (`ativos`) exclui os arquivados (`discarded`) — conserto do comportamento da 013.
 * Escopo por `user_id` (a RLS reforça). Em erro devolve página vazia (o hub nunca quebra).
 */
export async function listDrafts(
  supabase: SupabaseServerClient,
  userId: string,
  options: ListDraftsOptions = {}
): Promise<DraftListPage> {
  const limit = clampLimit(options.limit)

  let query = supabase
    .from('drafts')
    .select(DRAFT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options.status === 'arquivados') query = query.eq('status', 'discarded')
  else if (options.status === 'copiados') query = query.eq('status', 'copied')
  else query = query.neq('status', 'discarded')

  if (options.format) query = query.eq('format', options.format)
  if (options.cursor) query = query.lt('created_at', options.cursor)

  const { data, error } = await query.limit(limit + 1)

  if (error || !data) return { items: [], nextCursor: null }

  const rows = data as DraftRow[]
  const hasMore = rows.length > limit
  const items = (hasMore ? rows.slice(0, limit) : rows).map(toDraft)
  const nextCursor = hasMore ? items[items.length - 1]?.createdAt ?? null : null

  return { items, nextCursor }
}

/**
 * Indica se o usuário tem ao menos um rascunho em qualquer status. Usado pelo hub para distinguir o
 * vazio pristino (mostra os caminhos de entrada) do vazio de filtro (mostra "nada neste filtro").
 * Count `head` — não traz linhas.
 */
export async function hasAnyDraft(supabase: SupabaseServerClient, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('drafts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  return (count ?? 0) > 0
}

/**
 * Exclui definitivamente um rascunho do próprio usuário (FR-008). Filtra por `id` E `user_id`,
 * apoiado na política RLS `delete` da 013: um id de outro usuário não apaga nada. Devolve `true`
 * em sucesso, `false` em erro — a rota mapeia silêncio (204), nunca confirma existência alheia.
 */
export async function deleteDraft(
  supabase: SupabaseServerClient,
  userId: string,
  draftId: string
): Promise<boolean> {
  const { error } = await supabase.from('drafts').delete().eq('id', draftId).eq('user_id', userId)

  return !error
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

// Teto de rascunhos com feedback considerados na recalibração (013/014 → 015). Limita o volume
// enviado ao LLM e o custo da query; o limiar de sugestão (3) é muito menor, então não distorce.
const MAX_FEEDBACK_DRAFTS = 40

interface VoiceFeedbackRow {
  body: string
  voice_feedback: VoiceFeedback
  updated_at: string
}

/** Sinal de voz + os corpos dos rascunhos que soaram / não soaram, para sugerir e aplicar a recalibração. */
export interface VoiceFeedbackData {
  signal: VoiceSignal
  soa: string[]
  naoSoa: string[]
}

const EMPTY_SIGNAL: VoiceSignal = { soaCount: 0, naoSoaCount: 0, lastFeedbackAt: null }

/**
 * Lê só o SINAL de voz (sem corpos): conta "soa"/"nao_soa" e o feedback mais recente. É o que a
 * página da Presença e o modo "sugerir" da rota precisam para decidir se vale recalibrar — sem
 * trazer os corpos dos rascunhos à toa (evita até 40 bodies no carregamento da página).
 */
export async function getVoiceSignal(
  supabase: SupabaseServerClient,
  userId: string
): Promise<VoiceSignal> {
  const { data, error } = await supabase
    .from('drafts')
    .select('voice_feedback, updated_at')
    .eq('user_id', userId)
    .in('voice_feedback', ['soa', 'nao_soa'])
    .order('updated_at', { ascending: false })
    .limit(MAX_FEEDBACK_DRAFTS)

  if (error || !data) return EMPTY_SIGNAL

  const rows = data as { voice_feedback: VoiceFeedback; updated_at: string }[]
  const soaCount = rows.filter((r) => r.voice_feedback === 'soa').length
  const naoSoaCount = rows.filter((r) => r.voice_feedback === 'nao_soa').length

  return { soaCount, naoSoaCount, lastFeedbackAt: rows[0]?.updated_at ?? null }
}

/**
 * Lê os rascunhos com feedback de voz do usuário (015) COM os corpos: conta "soa"/"nao_soa", separa
 * os corpos por sinal e marca o feedback mais recente. Usado só ao APLICAR a recalibração (precisa
 * dos corpos como insumo do LLM). Escopo por `user_id` (a RLS reforça); em erro devolve vazio.
 * Sem logar corpo.
 */
export async function getVoiceFeedbackData(
  supabase: SupabaseServerClient,
  userId: string
): Promise<VoiceFeedbackData> {
  const empty: VoiceFeedbackData = { signal: EMPTY_SIGNAL, soa: [], naoSoa: [] }

  const { data, error } = await supabase
    .from('drafts')
    .select('body, voice_feedback, updated_at')
    .eq('user_id', userId)
    .in('voice_feedback', ['soa', 'nao_soa'])
    .order('updated_at', { ascending: false })
    .limit(MAX_FEEDBACK_DRAFTS)

  if (error || !data) return empty

  const rows = data as VoiceFeedbackRow[]
  const soa = rows.filter((r) => r.voice_feedback === 'soa').map((r) => r.body)
  const naoSoa = rows.filter((r) => r.voice_feedback === 'nao_soa').map((r) => r.body)

  return {
    signal: { soaCount: soa.length, naoSoaCount: naoSoa.length, lastFeedbackAt: rows[0]?.updated_at ?? null },
    soa,
    naoSoa,
  }
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
