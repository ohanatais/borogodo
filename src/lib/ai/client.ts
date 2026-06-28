import { getProvider, type AIAction, type LLMRequest } from '@/lib/ai/provider'
import { costUsd } from '@/lib/ai/cost/cost'
import { getLimits } from '@/lib/ai/cost/limits'
import { sendOpsAlert } from '@/lib/ai/cost/alert'
import { DailyCapReachedError, RateLimitedError } from '@/lib/errors'
import {
  GENERATION_ACTIONS,
  countGenerationsLastHour,
  insertUsageEvent,
  secondsUntilGenerationFrees,
  sumDailyCostUsd,
  tryMarkDailyAlert,
} from '@/lib/db/aiUsage'
import { logger } from '@/lib/log'

/**
 * Requisição do guard: o pedido de LLM + quem disparou (`userId`) e qual ação (`action`).
 * `userId`/`action` ficam aqui, não no provider — o provider não precisa conhecer o usuário.
 */
export interface GuardedRequest extends LLMRequest {
  userId: string
  action: AIAction
}

function isGenerationAction(action: AIAction): boolean {
  return (GENERATION_ACTIONS as readonly AIAction[]).includes(action)
}

/**
 * Pré-checagem do freio (023). Só ações de geração disparadas pela pessoa entram; captura/insight
 * passam direto. Lança `RateLimitedError`/`DailyCapReachedError` ANTES de gastar a chamada.
 * Exportada para o chat (que stream-a por fora do provider) reusar o mesmo freio.
 */
export async function assertWithinLimits(userId: string, action: AIAction): Promise<void> {
  if (!isGenerationAction(action)) {
    return
  }
  const limits = getLimits()

  const recentGenerations = await countGenerationsLastHour(userId)
  if (recentGenerations >= limits.ratePerHour) {
    throw new RateLimitedError(await secondsUntilGenerationFrees(userId))
  }

  const dailySpend = await sumDailyCostUsd()
  if (dailySpend >= limits.dailyCapUsd) {
    throw new DailyCapReachedError()
  }
}

interface UsageRecord {
  userId: string
  action: AIAction
  role: 'extraction' | 'synthesis'
  model: string
  inputTokens: number
  outputTokens: number
}

/**
 * Registra o consumo de uma chamada e avalia os alertas diários. Best-effort: nunca propaga.
 * Exportada para o chat registrar seu uso após o streaming terminar.
 */
export async function recordUsageAndMaybeAlert(record: UsageRecord): Promise<void> {
  try {
    await insertUsageEvent({
      ...record,
      costUsd: costUsd(record.model, record.inputTokens, record.outputTokens),
    })
  } catch (error) {
    logger.error('ai_usage_record_failed', {
      action: record.action,
      reason: error instanceof Error ? error.message : 'unknown',
    })
  }
  await evaluateDailyAlert()
}

/** Avalia se o gasto do dia cruzou o limiar de aviso ou o teto e dispara o e-mail (uma vez/dia). */
async function evaluateDailyAlert(): Promise<void> {
  try {
    const limits = getLimits()
    const dailySpend = await sumDailyCostUsd()

    if (dailySpend >= limits.dailyCapUsd) {
      if (await tryMarkDailyAlert('capped')) {
        await sendOpsAlert('cap_reached')
      }
    } else if (dailySpend >= limits.dailyCapUsd * limits.warnRatio) {
      if (await tryMarkDailyAlert('warned')) {
        await sendOpsAlert('preventive')
      }
    }
  } catch (error) {
    logger.error('ai_alert_eval_failed', { reason: error instanceof Error ? error.message : 'unknown' })
  }
}

/**
 * Ponto único de entrada para toda chamada paga de LLM (023-freio-de-custo). Aplica o freio,
 * delega ao provider ativo, registra o uso e avalia os alertas operacionais. Devolve só o texto.
 */
export async function complete(request: GuardedRequest): Promise<string> {
  await assertWithinLimits(request.userId, request.action)

  const result = await getProvider().complete({
    role: request.role,
    system: request.system,
    user: request.user,
    maxTokens: request.maxTokens,
  })

  await recordUsageAndMaybeAlert({
    userId: request.userId,
    action: request.action,
    role: request.role,
    model: result.model,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
  })

  return result.text
}
