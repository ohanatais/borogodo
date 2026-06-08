import { logger } from '@/lib/log'
import { maybeRegenerateMirror as regenerateMirror } from '@/lib/ai/mirror/maybeRegenerate'

/**
 * Stub no-op — preenchido pela feature 005-panel (tabela `proactive_insights` ainda não existe).
 * Mantido como costura: a assinatura não muda quando 005 implementar o corpo real.
 */
export async function triggerProactiveInsight(userId: string): Promise<void> {
  void userId
}

/**
 * Costura da feature 004-mirror: delega para o corpo real (regeneração por limiar, Sonnet).
 * A assinatura não muda — `/api/capture` (003) continua chamando como antes.
 */
export async function maybeRegenerateMirror(userId: string, totalEntries: number): Promise<void> {
  await regenerateMirror(userId, totalEntries)
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
