import { render, screen } from '@testing-library/react'
import { HowItWorksSection } from '../HowItWorksSection'

describe('HowItWorksSection', () => {
  it('renders exactly 3 step items', () => {
    render(<HowItWorksSection />)
    const steps = screen.getAllByRole('article')
    expect(steps).toHaveLength(3)
  })

  it('renders step number indicators (01, 02, 03)', () => {
    render(<HowItWorksSection />)
    expect(screen.getByText('steps.0.number')).toBeInTheDocument()
    expect(screen.getByText('steps.1.number')).toBeInTheDocument()
    expect(screen.getByText('steps.2.number')).toBeInTheDocument()
  })
})
