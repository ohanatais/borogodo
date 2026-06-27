import { render, screen } from '@testing-library/react'
import { HeroSection } from '../HeroSection'

describe('HeroSection', () => {
  it('renders a single h1 heading (the pain headline)', () => {
    render(<HeroSection />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('primary CTA points to signup', () => {
    const { container } = render(<HeroSection />)
    expect(container.querySelector('a[href="/login?mode=signup"]')).toBeInTheDocument()
  })

  it('does not render a competing "Entrar" link in the hero (single CTA)', () => {
    const { container } = render(<HeroSection />)
    expect(container.querySelector('a[href="/login"]')).not.toBeInTheDocument()
  })

  it('renders the demo with a force tag and its cited proof', () => {
    render(<HeroSection />)
    expect(screen.getAllByText('forceLabel').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('proofText', { exact: false })).toBeInTheDocument()
  })
})
