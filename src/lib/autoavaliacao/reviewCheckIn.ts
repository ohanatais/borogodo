/**
 * Check-in de revisão (019, US2 follow-up) — fecha o loop "refletir → planejar → REVISAR". Quando a data
 * de revisão que a pessoa marcou chega, ela é recebida com o COMPROMISSO anterior + "como foi?"; a
 * resposta vira um registro (reusa o pipeline de captura). Funções puras (`now` injetável), espelhando
 * `getReviewCycleSignal`. O check-in é o oposto do sinal de painel: aquele convida ANTES da data, este
 * recebe DEPOIS dela.
 */

export interface ReviewCheckInInput {
  reviewCycleMonths: number | null
  reviewCycleAnchor: string | null // ISO date (a data que a pessoa marcou ao aceitar o plano)
  now: Date
  /** Compromisso (`commitmentQuestion`) da autoavaliação mais recente, ou null se não houver. */
  latestCommitment: string | null
  latestDraftId: string | null
}

export type ReviewCheckIn =
  | { show: false }
  | { show: true; commitment: string; draftId: string }

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Decide se mostra o check-in: precisa de recorrência configurada, da data marcada já ter chegado
 * (`anchor <= hoje`) e de um compromisso anterior para revisar. Sem qualquer um → não mostra.
 */
export function getReviewCheckIn({
  reviewCycleMonths,
  reviewCycleAnchor,
  now,
  latestCommitment,
  latestDraftId,
}: ReviewCheckInInput): ReviewCheckIn {
  if (reviewCycleMonths == null || !reviewCycleAnchor) return { show: false }
  if (!latestCommitment || !latestDraftId) return { show: false }

  // Comparação date-only (igual à rota review-cycle) — estável a fuso.
  if (reviewCycleAnchor > toISODate(now)) return { show: false }

  return { show: true, commitment: latestCommitment, draftId: latestDraftId }
}

/**
 * Avança a âncora para a primeira ocorrência estritamente futura, em passos de `months`. Ao responder o
 * check-in, fecha o ciclo atual e reagenda o próximo — sem coluna nova e mantendo o calendário honesto.
 * Idempotente: âncora já futura volta inalterada (uma chamada espúria não empurra o ciclo à frente).
 */
export function advanceReviewAnchor(anchor: string, months: number, now: Date = new Date()): string {
  const today = toISODate(now)
  const next = new Date(anchor)
  while (toISODate(next) <= today) {
    next.setUTCMonth(next.getUTCMonth() + months)
  }
  return toISODate(next)
}
