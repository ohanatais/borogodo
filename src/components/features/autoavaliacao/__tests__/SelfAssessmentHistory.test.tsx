import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelfAssessmentHistory } from '../SelfAssessmentHistory'
import type { Draft } from '@/types/content'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/autoavaliacao',
}))

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
    angle: '',
    body: 'Entregas:\n...',
    status: 'draft',
    voiceFeedback: null,
    createdAt: '2025-06-30T12:00:00.000Z',
    ...over,
  }
}

describe('SelfAssessmentHistory (cockpit, US3)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mostra estado vazio quando não há autoavaliações', () => {
    render(<SelfAssessmentHistory items={[]} />)
    expect(screen.getByText('empty')).toBeInTheDocument()
  })

  it('lista cada autoavaliação com o período legível derivado do seedRef', () => {
    render(<SelfAssessmentHistory items={[draft()]} />)
    expect(screen.getAllByText(/2025/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('REABRE na cabine (?draft=<id>) ao clicar — nunca no fluxo de post', () => {
    render(<SelfAssessmentHistory items={[draft()]} />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockPush).toHaveBeenCalledWith('/autoavaliacao?draft=d1')
  })
})
