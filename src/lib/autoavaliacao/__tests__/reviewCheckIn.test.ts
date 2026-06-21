import { describe, it, expect } from 'vitest'
import { getReviewCheckIn, advanceReviewAnchor } from '../reviewCheckIn'

const NOW = new Date('2026-06-21T12:00:00Z')

describe('getReviewCheckIn — fecha o loop quando a revisão chega (019, US2 follow-up)', () => {
  const COMMITMENT = 'Você vai reservar 2h por semana para mentorar alguém do time?'

  it('sem recorrência (months null) → não mostra', () => {
    expect(
      getReviewCheckIn({ reviewCycleMonths: null, reviewCycleAnchor: '2026-01-01', now: NOW, latestCommitment: COMMITMENT, latestDraftId: 'd1' })
    ).toEqual({ show: false })
  })

  it('sem âncora (anchor null) → não mostra', () => {
    expect(
      getReviewCheckIn({ reviewCycleMonths: 3, reviewCycleAnchor: null, now: NOW, latestCommitment: COMMITMENT, latestDraftId: 'd1' })
    ).toEqual({ show: false })
  })

  it('a data marcada ainda é futura → não mostra (a revisão não chegou)', () => {
    expect(
      getReviewCheckIn({ reviewCycleMonths: 3, reviewCycleAnchor: '2026-07-01', now: NOW, latestCommitment: COMMITMENT, latestDraftId: 'd1' })
    ).toEqual({ show: false })
  })

  it('a data marcada já chegou (hoje) + há compromisso → mostra o check-in', () => {
    expect(
      getReviewCheckIn({ reviewCycleMonths: 3, reviewCycleAnchor: '2026-06-21', now: NOW, latestCommitment: COMMITMENT, latestDraftId: 'd1' })
    ).toEqual({ show: true, commitment: COMMITMENT, draftId: 'd1' })
  })

  it('a data marcada já passou + há compromisso → mostra o check-in', () => {
    expect(
      getReviewCheckIn({ reviewCycleMonths: 3, reviewCycleAnchor: '2026-06-01', now: NOW, latestCommitment: COMMITMENT, latestDraftId: 'd1' })
    ).toEqual({ show: true, commitment: COMMITMENT, draftId: 'd1' })
  })

  it('a data chegou mas não há compromisso anterior → não mostra (nada a revisar)', () => {
    expect(
      getReviewCheckIn({ reviewCycleMonths: 3, reviewCycleAnchor: '2026-06-01', now: NOW, latestCommitment: null, latestDraftId: null })
    ).toEqual({ show: false })
  })
})

describe('advanceReviewAnchor — avança a âncora para o próximo ciclo (evita re-nag, sem coluna nova)', () => {
  it('âncora no passado avança até a primeira ocorrência futura', () => {
    // 2026-03-01 + 3m → 03-01, 06-01, 09-01 → primeira > 21/jun = 2026-09-01.
    expect(advanceReviewAnchor('2026-03-01', 3, NOW)).toBe('2026-09-01')
  })

  it('âncora exatamente hoje avança um ciclo (revisão de hoje fica fechada)', () => {
    expect(advanceReviewAnchor('2026-06-21', 3, NOW)).toBe('2026-09-21')
  })

  it('âncora já futura permanece inalterada (idempotente: chamada espúria não empurra o ciclo)', () => {
    expect(advanceReviewAnchor('2026-08-15', 3, NOW)).toBe('2026-08-15')
  })
})
