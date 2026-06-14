import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { WelcomeStep } from '../WelcomeStep'

describe('WelcomeStep', () => {
  it('renders headline text', () => {
    render(<WelcomeStep userName="Ohana" onNext={() => {}} />)
    // mock returns translation key; headline key is 'headline'
    expect(screen.getByText('headline')).toBeInTheDocument()
  })

  it('renders CTA button', () => {
    render(<WelcomeStep userName="Ohana" onNext={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onNext when CTA is clicked', () => {
    const onNext = vi.fn()
    render(<WelcomeStep userName="Ohana" onNext={onNext} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('renders without crashing when userName is empty', () => {
    render(<WelcomeStep userName="" onNext={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
