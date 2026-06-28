/**
 * Normaliza um valor desconhecido de catch para uma mensagem legível (sem dados de usuário).
 * Centraliza o que antes era reimplementado em cada rota/job.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error'
}

/**
 * Erro de domínio: o usuário não tem entradas para gerar o espelho.
 * Tipado (em vez de comparar a mensagem por string) para a rota mapear 400 sem acoplar texto.
 */
export class NoEntriesError extends Error {
  constructor() {
    super('Sem entradas')
    this.name = 'NoEntriesError'
  }
}

export class NoExtractableContentError extends Error {
  constructor() {
    super('Nada para extrair')
    this.name = 'NoExtractableContentError'
  }
}

/**
 * Erro de domínio: a geração de conteúdo falhou nas regras (Zod ou ruleset anti-IA) mesmo após
 * a regeneração única. Tipado para a rota mapear 422 sem acoplar texto (013-motor-de-voz).
 */
export class GenerationFailedError extends Error {
  readonly violations: number[]

  constructor(violations: number[] = []) {
    super('Falha ao gerar conteúdo dentro das regras')
    this.name = 'GenerationFailedError'
    this.violations = violations
  }
}

/**
 * Erro de domínio (023-freio-de-custo): o usuário atingiu o limite por hora de ações de geração.
 * Tipado para a rota mapear 429 + Retry-After sem acoplar texto. Captura nunca lança isto.
 */
export class RateLimitedError extends Error {
  readonly retryAfterSeconds: number

  constructor(retryAfterSeconds: number) {
    super('Limite por hora atingido')
    this.name = 'RateLimitedError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

/**
 * Erro de domínio (023-freio-de-custo): a trava global de gasto diário foi atingida; novas ações
 * de geração ficam seguradas até virar o dia. O usuário vê uma mensagem de sobrecarga (não o
 * motivo real). Captura/insight nunca lançam isto.
 */
export class DailyCapReachedError extends Error {
  constructor() {
    super('Teto diário de gasto de IA atingido')
    this.name = 'DailyCapReachedError'
  }
}
