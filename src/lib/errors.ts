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
