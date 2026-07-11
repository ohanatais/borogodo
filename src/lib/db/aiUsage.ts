import { getSupabaseAdmin } from '@/lib/db/supabaseAdmin'
import type { AIAction } from '@/lib/ai/provider'

/** Ações de geração disparadas pela pessoa — as únicas sujeitas ao limite por hora (023). */
export const GENERATION_ACTIONS: readonly AIAction[] = ['mirror', 'post', 'self_assessment', 'chat', 'voice']

const ONE_HOUR_MS = 60 * 60 * 1000

interface UsageEventInput {
  userId: string
  action: AIAction
  role: 'extraction' | 'synthesis'
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
}

function startOfUtcDayIso(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}

/** Tamanho da página ao varrer as linhas do dia. O PostgREST limita o retorno (~1000 por padrão),
 * então paginamos explicitamente — senão a soma diária truncaria e a trava de custo pararia de
 * disparar silenciosamente num dia de volume alto (o oposto do que o freio existe para garantir). */
const DAY_SCAN_PAGE = 1000

/**
 * Varre TODAS as linhas do dia (UTC) para as colunas pedidas, paginando até esgotar. Retorna o
 * conjunto completo — nunca um recorte truncado. Volume de beta é pequeno; correção > micro-perf.
 */
async function fetchAllDayRows<T>(columns: string): Promise<T[]> {
  const admin = getSupabaseAdmin()
  const since = startOfUtcDayIso()
  const rows: T[] = []
  for (let from = 0; ; from += DAY_SCAN_PAGE) {
    const { data, error } = await admin
      .from('ai_usage_events')
      .select(columns)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .range(from, from + DAY_SCAN_PAGE - 1)

    if (error) {
      throw new Error(`fetchAllDayRows: ${error.message}`)
    }
    const page = (data ?? []) as T[]
    rows.push(...page)
    if (page.length < DAY_SCAN_PAGE) {
      break
    }
  }
  return rows
}

function utcDayString(): string {
  return startOfUtcDayIso().slice(0, 10)
}

/** Segundos até a próxima virada de dia (UTC), quando a trava diária reinicia. Mínimo de 60. */
export function secondsUntilUtcDayReset(): number {
  const now = new Date()
  const nextDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return Math.max(60, Math.ceil((nextDay - now.getTime()) / 1000))
}

/** Registra uma chamada paga de IA. Server-only (service-role). */
export async function insertUsageEvent(event: UsageEventInput): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('ai_usage_events')
    .insert({
      user_id: event.userId,
      action: event.action,
      role: event.role,
      model: event.model,
      input_tokens: event.inputTokens,
      output_tokens: event.outputTokens,
      cost_usd: event.costUsd,
    })

  if (error) {
    throw new Error(`insertUsageEvent: ${error.message}`)
  }
}

/** Quantas ações de geração o usuário disparou na última hora (base do limite anti-robô). */
export async function countGenerationsLastHour(userId: string): Promise<number> {
  const since = new Date(Date.now() - ONE_HOUR_MS).toISOString()
  const { count, error } = await getSupabaseAdmin()
    .from('ai_usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('action', GENERATION_ACTIONS as readonly string[] as string[])
    .gte('created_at', since)

  if (error) {
    throw new Error(`countGenerationsLastHour: ${error.message}`)
  }
  return count ?? 0
}

/**
 * Quantos segundos até a ação de geração mais antiga (na janela de 1h) sair da contagem e liberar
 * um slot. Usado só quando o usuário já está bloqueado (cold path), para o `Retry-After`.
 */
export async function secondsUntilGenerationFrees(userId: string): Promise<number> {
  const since = new Date(Date.now() - ONE_HOUR_MS).toISOString()
  const { data, error } = await getSupabaseAdmin()
    .from('ai_usage_events')
    .select('created_at')
    .eq('user_id', userId)
    .in('action', GENERATION_ACTIONS as readonly string[] as string[])
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) {
    throw new Error(`secondsUntilGenerationFrees: ${error.message}`)
  }
  const oldest = data?.[0]?.created_at
  if (!oldest) {
    return 60
  }
  const remainingMs = ONE_HOUR_MS - (Date.now() - new Date(oldest).getTime())
  return Math.max(60, Math.min(3600, Math.ceil(remainingMs / 1000)))
}

/** Gasto total de IA acumulado no dia (UTC) — base do limiar de aviso e da trava diária. */
export async function sumDailyCostUsd(): Promise<number> {
  const rows = await fetchAllDayRows<{ cost_usd: number | string | null }>('cost_usd')
  return rows.reduce((sum, row) => sum + Number(row.cost_usd ?? 0), 0)
}

export interface ConsumerSummary {
  userId: string
  email: string | null
  costUsd: number
  actions: number
}

export interface OpsSnapshot {
  totalUsd: number
  activeUsers: number
  ranking: ConsumerSummary[]
  blocked: { userId: string; email: string | null }[]
}

interface DayRow {
  user_id: string
  action: AIAction
  cost_usd: number | string
  created_at: string
}

async function emailFor(userId: string): Promise<string | null> {
  const { data } = await getSupabaseAdmin().auth.admin.getUserById(userId)
  return data.user?.email ?? null
}

/**
 * Retrato operacional do dia para o e-mail de alerta (cold path). Agrega as linhas do dia em
 * memória — volume de beta é pequeno. Busca e-mail só dos poucos usuários relevantes.
 */
export async function dailyOpsSnapshot(rateLimit: number): Promise<OpsSnapshot> {
  const rows = await fetchAllDayRows<DayRow>('user_id, action, cost_usd, created_at')
  const byUser = new Map<string, { costUsd: number; actions: number; recentGenerations: number }>()
  const sinceHour = Date.now() - ONE_HOUR_MS

  for (const row of rows) {
    const entry = byUser.get(row.user_id) ?? { costUsd: 0, actions: 0, recentGenerations: 0 }
    entry.costUsd += Number(row.cost_usd ?? 0)
    entry.actions += 1
    if (GENERATION_ACTIONS.includes(row.action) && new Date(row.created_at).getTime() >= sinceHour) {
      entry.recentGenerations += 1
    }
    byUser.set(row.user_id, entry)
  }

  const totalUsd = rows.reduce((sum, row) => sum + Number(row.cost_usd ?? 0), 0)
  const topUserIds = [...byUser.entries()].sort((a, b) => b[1].costUsd - a[1].costUsd).slice(0, 5)
  const blockedUserIds = [...byUser.entries()].filter(([, v]) => v.recentGenerations >= rateLimit)

  // Resolve o e-mail de cada usuário relevante UMA vez (um usuário pode estar no ranking e travado).
  const relevantIds = new Set<string>([...topUserIds, ...blockedUserIds].map(([userId]) => userId))
  const emailById = new Map<string, string | null>(
    await Promise.all([...relevantIds].map(async (userId) => [userId, await emailFor(userId)] as const))
  )

  const ranking = topUserIds.map(([userId, v]) => ({ userId, email: emailById.get(userId) ?? null, costUsd: v.costUsd, actions: v.actions }))
  const blocked = blockedUserIds.map(([userId]) => ({ userId, email: emailById.get(userId) ?? null }))

  return { totalUsd, activeUsers: byUser.size, ranking, blocked }
}

export type AlertKind = 'warned' | 'capped'

/**
 * Marca (idempotente) que o alerta `kind` foi enviado hoje. Retorna `true` apenas para a chamada
 * que efetivamente setou o timestamp — garante um e-mail por dia mesmo sob concorrência (a
 * cláusula `.is(col, null)` faz o Postgres deixar só um update vencer).
 */
export async function tryMarkDailyAlert(kind: AlertKind): Promise<boolean> {
  const admin = getSupabaseAdmin()
  const day = utcDayString()
  const column = kind === 'warned' ? 'warned_at' : 'capped_at'

  await admin.from('ai_daily_alert_state').upsert({ day }, { onConflict: 'day', ignoreDuplicates: true })

  const { data, error } = await admin
    .from('ai_daily_alert_state')
    .update({ [column]: new Date().toISOString() })
    .eq('day', day)
    .is(column, null)
    .select('day')

  if (error) {
    throw new Error(`tryMarkDailyAlert: ${error.message}`)
  }
  return (data?.length ?? 0) > 0
}
