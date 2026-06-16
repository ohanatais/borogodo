import { logger } from '@/lib/log'
import { maybeRegenerateMirror as regenerateMirror } from '@/lib/ai/mirror/maybeRegenerate'
import { triggerProactiveInsight as generateProactiveInsight } from '@/lib/ai/insights/triggerProactiveInsight'
import { getSupabaseAdmin } from '@/lib/db/supabaseAdmin'
import { getEnrichmentNudge } from '@/lib/panel/getEnrichmentNudge'

/**
 * Costura da feature 005-panel: delega para o corpo real (geração via Haiku, persistência
 * em `proactive_insights`). A assinatura não muda — `/api/capture` (003) continua chamando
 * como antes (fire-and-forget, sem bloquear a resposta da captura).
 */
export async function triggerProactiveInsight(userId: string): Promise<void> {
  await generateProactiveInsight(userId)
}

/**
 * Costura da feature 004-mirror: delega para o corpo real (regeneração por limiar, Sonnet).
 * A assinatura não muda — `/api/capture` (003) continua chamando como antes.
 */
export async function maybeRegenerateMirror(userId: string): Promise<void> {
  await regenerateMirror(userId)
}

/**
 * Detecta entradas magras e cria UMA pergunta cirúrgica assíncrona por ciclo.
 * Chama getEnrichmentNudge buscando entradas sem metric/impact e insights existentes.
 */
export async function triggerEnrichmentNudge(userId: string): Promise<void> {
  const admin = getSupabaseAdmin()

  const [entriesRes, insightsRes] = await Promise.all([
    admin
      .from('entries')
      .select('id, what_i_did, metric, impact')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('proactive_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'enrichment_nudge'),
  ])

  const entries = (entriesRes.data ?? []) as { id: string; what_i_did: string; metric: string | null; impact: string | null }[]
  const existing = (insightsRes.data ?? []) as import('@/types/insight').ProactiveInsight[]

  await getEnrichmentNudge(userId, entries, existing)
}

/**
 * Dispara um job assíncrono sem bloquear a resposta da rota.
 * Constituição proíbe catch vazio — todo erro é logado (sem dados de usuário).
 */
export function fireAndForget(jobName: string, job: Promise<void>): void {
  job.catch((error: unknown) => {
    logger.error('async job failed', {
      job: jobName,
      message: error instanceof Error ? error.message : 'unknown error',
    })
  })
}
