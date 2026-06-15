import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SuggestionsStrip } from '../SuggestionsStrip'
import { PRESENCA_OPEN_EVENT, type PresencaOpenDetail } from '@/components/features/content/presencaEvents'
import type { ContentSuggestion } from '@/types/content'

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))

const mockMarkSeen = vi.fn()
vi.mock('@/lib/actions/insights', () => ({ markInsightSeen: (...args: unknown[]) => mockMarkSeen(...args) }))

const NUDGE: ContentSuggestion = {
  id: 'nudge-i1',
  kind: 'nudge',
  seedType: 'entry',
  seedRef: 'e1',
  seedSummary: 'Lancei o app',
  formats: ['post', 'impact_summary'],
  insightId: 'i1',
}
const THEME: ContentSuggestion = {
  id: 'theme-x',
  kind: 'theme',
  seedType: 'theme',
  seedRef: 'produto 0→1',
  seedSummary: 'produto 0→1',
  formats: ['post'],
}

describe('SuggestionsStrip', () => {
  beforeEach(() => vi.clearAllMocks())

  it('some quando não há material (sem placeholder vazio)', () => {
    const { container } = render(<SuggestionsStrip suggestions={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('mostra os cartões com material', () => {
    render(<SuggestionsStrip suggestions={[NUDGE, THEME]} />)
    expect(screen.getByText('suggestions.title')).toBeInTheDocument()
    expect(screen.getByText('Lancei o app')).toBeInTheDocument()
    expect(screen.getByText('produto 0→1')).toBeInTheDocument()
  })

  it('clicar num nudge abre a geração com a evidência e marca o insight como visto', () => {
    render(<SuggestionsStrip suggestions={[NUDGE]} />)

    let detail: PresencaOpenDetail | null = null
    const handler = (e: Event) => {
      detail = (e as CustomEvent<PresencaOpenDetail>).detail
    }
    window.addEventListener(PRESENCA_OPEN_EVENT, handler)
    act(() => {
      screen.getByText('Lancei o app').closest('button')!.click()
    })
    window.removeEventListener(PRESENCA_OPEN_EVENT, handler)

    expect(detail).not.toBeNull()
    expect(detail!.seedType).toBe('entry')
    expect(detail!.seedRef).toBe('e1')
    expect(mockMarkSeen).toHaveBeenCalledWith('i1')
  })

  it('clicar num tema abre a geração e NÃO marca insight (não é nudge)', () => {
    render(<SuggestionsStrip suggestions={[THEME]} />)
    act(() => {
      screen.getByText('produto 0→1').closest('button')!.click()
    })
    expect(mockMarkSeen).not.toHaveBeenCalled()
  })
})
