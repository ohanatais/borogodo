/**
 * Sinal de calendário do ciclo de avaliação (019, US2, research D7). Paralelo ao `getReturnSignal` da
 * 016: aquele ressurge por DELTA (entrada nova), este por CALENDÁRIO (ritmo de avaliação). Função pura
 * (`now` injetável), só painel no v1 (sem e-mail). Sem recorrência → nunca dispara (FR-009).
 */

export type ReviewCycleSignal =
  | { type: 'none' }
  | { type: 'approaching'; mode: 'write' } // ciclo perto + dados → convida a escrever a autoavaliação
  | { type: 'approaching'; mode: 'feed-first' } // ciclo perto + poucos dados → convida a registrar antes

export interface GetReviewCycleSignalInput {
  reviewCycleMonths: number | null
  reviewCycleAnchor: string | null // ISO date (a data que a pessoa definiu ao aceitar o plano)
  now: Date
  hasRecentEntries: boolean
}

const MS_PER_DAY = 86_400_000
/** Janela de proximidade: o convite surge quando faltam até este número de dias para a próxima revisão. */
const APPROACH_WINDOW_DAYS = 14

export function getReviewCycleSignal({
  reviewCycleMonths,
  reviewCycleAnchor,
  now,
  hasRecentEntries,
}: GetReviewCycleSignalInput): ReviewCycleSignal {
  if (reviewCycleMonths == null || !reviewCycleAnchor) {
    return { type: 'none' }
  }

  // Próxima revisão = âncora avançada de `reviewCycleMonths` em `reviewCycleMonths` até cair em/depois de agora.
  const next = new Date(reviewCycleAnchor)
  while (next.getTime() < now.getTime()) {
    next.setUTCMonth(next.getUTCMonth() + reviewCycleMonths)
  }

  const daysUntil = Math.ceil((next.getTime() - now.getTime()) / MS_PER_DAY)
  if (daysUntil <= APPROACH_WINDOW_DAYS) {
    return { type: 'approaching', mode: hasRecentEntries ? 'write' : 'feed-first' }
  }

  return { type: 'none' }
}

/**
 * Próxima data de revisão agendada (ISO `YYYY-MM-DD`), ou `null` sem recorrência. Avança a âncora de
 * `reviewCycleMonths` em `reviewCycleMonths` até a primeira ocorrência em/depois de agora. Usado na
 * tela de autoavaliações para mostrar a revisão agendada (US2, follow-up).
 */
export function getNextReviewDate(
  reviewCycleMonths: number | null,
  reviewCycleAnchor: string | null,
  now: Date
): string | null {
  if (reviewCycleMonths == null || !reviewCycleAnchor) return null

  const next = new Date(reviewCycleAnchor)
  while (next.getTime() < now.getTime()) {
    next.setUTCMonth(next.getUTCMonth() + reviewCycleMonths)
  }
  return next.toISOString().slice(0, 10)
}
