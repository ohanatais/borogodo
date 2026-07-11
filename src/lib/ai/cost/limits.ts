/**
 * Limites do freio de custo de IA (023). Configuráveis por env, com defaults seguros para o beta
 * controlado. Lidos a cada chamada (env é estável; sem cache para permitir ajuste sem deploy).
 *
 * - AI_RATE_LIMIT_PER_HOUR: máx. de ações de geração por usuário por hora (anti-robô).
 * - AI_DAILY_CAP_USD: teto diário de gasto total de IA (rede de segurança).
 * - AI_DAILY_WARN_RATIO: fração do teto que dispara o e-mail preventivo (0–1).
 */
export interface AiLimits {
  ratePerHour: number
  dailyCapUsd: number
  warnRatio: number
}

const DEFAULTS: AiLimits = {
  ratePerHour: 10,
  dailyCapUsd: 10,
  warnRatio: 0.7,
}

function readNumber(value: string | undefined, fallback: number, min: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback
  }
  return parsed
}

export function getLimits(): AiLimits {
  const warn = readNumber(process.env.AI_DAILY_WARN_RATIO, DEFAULTS.warnRatio, 0)
  return {
    ratePerHour: Math.floor(readNumber(process.env.AI_RATE_LIMIT_PER_HOUR, DEFAULTS.ratePerHour, 1)),
    dailyCapUsd: readNumber(process.env.AI_DAILY_CAP_USD, DEFAULTS.dailyCapUsd, 0.01),
    // ratio acima de 1 não faria sentido (avisaria depois de travar); fixa o teto em 1.
    warnRatio: warn > 1 ? DEFAULTS.warnRatio : warn,
  }
}

export const OPS_ALERT_EMAIL = process.env.OPS_ALERT_EMAIL ?? 'admin@borogodo.ai'
