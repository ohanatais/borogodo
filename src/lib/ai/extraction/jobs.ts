import { logger } from '@/lib/log'
import { maybeRegenerateMirror as regenerateMirror } from '@/lib/ai/mirror/maybeRegenerate'
import { triggerProactiveInsight as generateProactiveInsight } from '@/lib/ai/insights/triggerProactiveInsight'

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
