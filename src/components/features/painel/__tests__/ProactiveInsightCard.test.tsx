import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ProactiveInsight } from '@/types/insight'
import { ProactiveInsightCard } from '../ProactiveInsightCard'

const mockMarkSeen = vi.hoisted(() => vi.fn())
vi.mock('@/lib/actions/insights', () => ({ markInsightSeen: mockMarkSeen }))

const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

const INSIGHT: ProactiveInsight = {
  id: 'insight-1',
  user_id: 'user-1',
  type: 'invisible_skill',
  headline: 'Você medeia conflitos com leveza',
  body: 'Em 4 situações recentes você resolveu impasses entre áreas sem escalar.',
  entry_ids: ['e1', 'e2'],
  seen: false,
  generated_at: '2026-06-07T10:00:00Z',
}

beforeEach(() => {
  mockMarkSeen.mockReset()
  mockObserve.mockReset()
  mockDisconnect.mockReset()

  const observe = mockObserve
  const disconnect = mockDisconnect

  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    }
    observe = observe
    disconnect = disconnect
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

describe('ProactiveInsightCard', () => {
  it('T027: does not render when there is no insight', () => {
    const { container } = render(<ProactiveInsightCard insight={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('T027: renders the insight label, headline and body', () => {
    render(<ProactiveInsightCard insight={INSIGHT} />)

    expect(screen.getByText('insight.label')).toBeInTheDocument()
    expect(screen.getByText(INSIGHT.headline)).toBeInTheDocument()
    expect(screen.getByText(INSIGHT.body)).toBeInTheDocument()
  })

  it('T027: marks insight seen when the card scrolls into view', () => {
    render(<ProactiveInsightCard insight={INSIGHT} />)
    expect(mockMarkSeen).toHaveBeenCalledWith('insight-1')
  })

  it('T027: does not mark seen when insight is already seen', () => {
    render(<ProactiveInsightCard insight={{ ...INSIGHT, seen: true }} />)
    expect(mockMarkSeen).not.toHaveBeenCalled()
  })
})
