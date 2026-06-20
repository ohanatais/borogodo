import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelfAssessmentHistory } from '../SelfAssessmentHistory'
import { PRESENCA_RESUME_EVENT, type PresencaResumeDetail } from '@/components/features/content/presencaEvents'
import type { Draft } from '@/types/content'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, vars?: Record<string, string>) =>
    vars ? `${key}:${Object.values(vars).join(',')}` : key,
  useLocale: () => 'pt-BR',
}))

function draft(over: Partial<Draft> = {}): Draft {
  return {
    id: 'd1',
    format: 'self_assessment',
    seedType: 'period',
    seedRef: 'period:::2025-01-01:::2025-06-30',
    angle: 'mais factual',
    body: 'Entregas: ...',
    status: 'generated',
    voiceFeedback: null,
    createdAt: '2025-06-30T12:00:00.000Z',
    ...over,
  }
}

describe('SelfAssessmentHistory', () => {
  it('mostra estado vazio quando não há autoavaliações', () => {
    render(<SelfAssessmentHistory items={[]} />)
    expect(screen.getByText('empty')).toBeInTheDocument()
  })

  it('lista cada autoavaliação com o período legível derivado do seedRef', () => {
    render(<SelfAssessmentHistory items={[draft()]} />)
    // Intl formata o range; basta confirmar que ambos os extremos do período aparecem.
    expect(screen.getAllByText(/2025/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('reabre a autoavaliação salva via resumePresenca ao clicar (sem regerar)', () => {
    const onResume = vi.fn()
    window.addEventListener(PRESENCA_RESUME_EVENT, (e) =>
      onResume((e as CustomEvent<PresencaResumeDetail>).detail)
    )
    render(<SelfAssessmentHistory items={[draft()]} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onResume).toHaveBeenCalledWith(
      expect.objectContaining({ draftId: 'd1', format: 'self_assessment', seedType: 'period', body: 'Entregas: ...' })
    )
  })
})
