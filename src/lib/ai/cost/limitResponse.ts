import { NextResponse } from 'next/server'
import { DailyCapReachedError, RateLimitedError } from '@/lib/errors'

/**
 * Mapeia os erros do freio de custo (023) para uma resposta 429 padronizada. Devolve `null` se o
 * erro não for do freio (a rota segue com o próprio tratamento). O cliente traduz o `code` para a
 * mensagem honesta i18n; nenhum detalhe técnico (teto, gasto) vaza.
 */
export function aiLimitResponse(error: unknown): NextResponse | null {
  if (error instanceof RateLimitedError) {
    return NextResponse.json(
      { error: 'rate_limited', code: 'ai_rate_limited', retryAfterSeconds: error.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } }
    )
  }
  if (error instanceof DailyCapReachedError) {
    return NextResponse.json(
      { error: 'daily_cap', code: 'ai_overloaded', retryAfterSeconds: error.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } }
    )
  }
  return null
}
