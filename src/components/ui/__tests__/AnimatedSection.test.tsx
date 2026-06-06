import { render } from '@testing-library/react'
import { AnimatedSection } from '../AnimatedSection'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) =>
      React.createElement('div', { className, 'data-testid': 'motion-div' }, children),
  },
  useReducedMotion: vi.fn(),
}))

import { useReducedMotion } from 'framer-motion'
import React from 'react'

describe('AnimatedSection', () => {
  it('renders children without motion wrapper when reduced motion is true', () => {
    vi.mocked(useReducedMotion).mockReturnValue(true)
    const { queryByTestId, getByText } = render(
      <AnimatedSection>
        <span>Content</span>
      </AnimatedSection>
    )
    expect(getByText('Content')).toBeInTheDocument()
    expect(queryByTestId('motion-div')).not.toBeInTheDocument()
  })

  it('wraps children in motion.div when reduced motion is false', () => {
    vi.mocked(useReducedMotion).mockReturnValue(false)
    const { getByTestId } = render(
      <AnimatedSection>
        <span>Content</span>
      </AnimatedSection>
    )
    expect(getByTestId('motion-div')).toBeInTheDocument()
  })
})
