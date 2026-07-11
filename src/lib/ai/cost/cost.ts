import { logger } from '@/lib/log'

/**
 * Preço por milhão de tokens (input / output), em US$ — jun/2026.
 * Fonte: decision record 002-freio-de-custo-e-monetizacao.md.
 * Modelo sem entrada aqui → custo 0 (ex.: deepseek-chat, fora do caminho do beta).
 */
const PRICE_PER_MILLION: Record<string, { in: number; out: number }> = {
  'claude-haiku-4-5': { in: 1, out: 5 },
  'claude-sonnet-4-6': { in: 3, out: 15 },
}

const TOKENS_PER_MILLION = 1_000_000

/** Converte tokens consumidos em custo (US$) para um model id concreto. */
export function costUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICE_PER_MILLION[model]
  if (!price) {
    // Modelo sem preço mapeado conta como custo 0 — o que desarma a trava diária sem avisar. Se um
    // model id em uso não estiver aqui (ex.: bump de versão), isto precisa aparecer, não sumir.
    logger.error('ai_cost_unpriced_model', { model })
    return 0
  }

  return (inputTokens / TOKENS_PER_MILLION) * price.in + (outputTokens / TOKENS_PER_MILLION) * price.out
}
