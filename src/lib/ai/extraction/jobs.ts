import { logger } from '@/lib/log'

/**
 * Stub no-op — preenchido pela feature 005-panel (tabela `proactive_insights` ainda não existe).
 * Mantido como costura: a assinatura não muda quando 005 implementar o corpo real.
 */
export async function triggerProactiveInsight(userId: string): Promise<void> {
  void userId
}

/**
 * Stub no-op — preenchido pela feature 004-mirror (tabela `mirror_snapshots` ainda não existe).
 * Mantido como costura: a assinatura não muda quando 004 implementar o corpo real.
 */
export async function maybeRegenerateMirror(userId: string, totalEntries: number): Promise<void> {
  void userId
  void totalEntries
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
