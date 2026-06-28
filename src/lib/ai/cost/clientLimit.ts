/**
 * Helper client-safe (sem import de servidor) para detectar a resposta 429 do freio de custo (023)
 * e extrair o que a UI precisa: o tipo de limite e, quando aplicável, os minutos aproximados de
 * espera. Usado pelas superfícies de geração para mostrar a mensagem honesta no tom da marca.
 */
export type AiLimitKind = 'rateLimited' | 'overloaded'

export interface AiLimitInfo {
  kind: AiLimitKind
  minutes: number
}

interface LimitBody {
  code?: string
  retryAfterSeconds?: number
}

const SECONDS_PER_MINUTE = 60
const DEFAULT_RETRY_SECONDS = 3600

/** Devolve as infos do limite se a resposta for um 429 do freio; senão `null`. Não consome o body. */
export async function parseAiLimit(res: Response): Promise<AiLimitInfo | null> {
  if (res.status !== 429) {
    return null
  }
  const body = (await res
    .clone()
    .json()
    .catch(() => null)) as LimitBody | null

  if (body?.code === 'ai_rate_limited') {
    const seconds = body.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS
    return { kind: 'rateLimited', minutes: Math.max(1, Math.ceil(seconds / SECONDS_PER_MINUTE)) }
  }
  if (body?.code === 'ai_overloaded') {
    return { kind: 'overloaded', minutes: 0 }
  }
  return null
}
