import { render, screen } from '@testing-library/react'
import { HeroSection } from '../HeroSection'

describe('HeroSection', () => {
  it('renders an h1 heading', () => {
    render(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('T028: "Criar conta" link points to /login?mode=signup', () => {
    const { container } = render(<HeroSection />)
    const link = container.querySelector('a[href="/login?mode=signup"]')
    expect(link).toBeInTheDocument()
  })

  it('T028: "Já tenho conta" link points to /login', () => {
    const { container } = render(<HeroSection />)
    const link = container.querySelector('a[href="/login"]')
    expect(link).toBeInTheDocument()
  })

  it('CTA links have aria-label attributes', () => {
    const { container } = render(<HeroSection />)
    const links = container.querySelectorAll('a[aria-label]')
    expect(links.length).toBeGreaterThanOrEqual(2)
  })
})
