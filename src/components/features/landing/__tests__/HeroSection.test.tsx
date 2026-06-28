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

  it('renders the espelho video with a poster fallback', () => {
    const { container } = render(<HeroSection />)
    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video?.getAttribute('poster')).toBe('/landing/espelho.jpg')
  })
})
