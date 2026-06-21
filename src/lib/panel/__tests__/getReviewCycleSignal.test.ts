import { describe, it, expect } from 'vitest'
import { getReviewCycleSignal } from '../getReviewCycleSignal'

const NOW = new Date('2026-06-20T12:00:00Z')

describe('getReviewCycleSignal — gatilho de calendário (US2, 019)', () => {
  it('sem recorrência (months null) → none, nunca dispara (FR-009)', () => {
    const signal = getReviewCycleSignal({ reviewCycleMonths: null, reviewCycleAnchor: '2026-01-01', now: NOW, hasRecentEntries: true })
    expect(signal).toEqual({ type: 'none' })
  })

  it('sem âncora (anchor null) → none', () => {
    const signal = getReviewCycleSignal({ reviewCycleMonths: 3, reviewCycleAnchor: null, now: NOW, hasRecentEntries: true })
    expect(signal).toEqual({ type: 'none' })
  })

  it('ciclo longe da próxima revisão → none', () => {
    // anchor 2026-01-01, ciclo 3 meses → próximas: jan, abr, jul. Em 20/jun, a próxima (01/jul) está a ~11 dias.
    // Para testar "longe", uso ciclo de 6 meses: próximas jan, jul → 01/jul a ~11 dias ainda perto;
    // uso anchor 2026-02-20 + 6m = 2026-08-20 (~61 dias) → longe.
    const signal = getReviewCycleSignal({ reviewCycleMonths: 6, reviewCycleAnchor: '2026-02-20', now: NOW, hasRecentEntries: true })
    expect(signal).toEqual({ type: 'none' })
  })

  it('ciclo perto + dados recentes → approaching/write (convida a escrever)', () => {
    // anchor 2026-06-25 (5 dias à frente) → dentro da janela.
    const signal = getReviewCycleSignal({ reviewCycleMonths: 3, reviewCycleAnchor: '2026-06-25', now: NOW, hasRecentEntries: true })
    expect(signal).toEqual({ type: 'approaching', mode: 'write' })
  })

  it('ciclo perto + poucos dados → approaching/feed-first (convida a registrar antes, FR-008)', () => {
    const signal = getReviewCycleSignal({ reviewCycleMonths: 3, reviewCycleAnchor: '2026-06-25', now: NOW, hasRecentEntries: false })
    expect(signal).toEqual({ type: 'approaching', mode: 'feed-first' })
  })

  it('recorrência: âncora no passado avança para o próximo ciclo dentro da janela', () => {
    // anchor 2025-12-21, ciclo 3m → 2025-12-21, 2026-03-21, 2026-06-21 → 1 dia à frente: approaching.
    const signal = getReviewCycleSignal({ reviewCycleMonths: 3, reviewCycleAnchor: '2025-12-21', now: NOW, hasRecentEntries: true })
    expect(signal).toEqual({ type: 'approaching', mode: 'write' })
  })
})
