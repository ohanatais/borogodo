import { render, screen } from '@testing-library/react'
import { HeroSection } from '../HeroSection'

describe('HeroSection', () => {
  it('renders an h1 heading', () => {
    render(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('"Criar conta" link points to /sign-up', () => {
    const { container } = render(<HeroSection />)
    const link = container.querySelector('a[href="/sign-up"]')
    expect(link).toBeInTheDocument()
  })

  it('"Já tenho conta" link points to /sign-in', () => {
    const { container } = render(<HeroSection />)
    const link = container.querySelector('a[href="/sign-in"]')
    expect(link).toBeInTheDocument()
  })

  it('CTA links have aria-label attributes', () => {
    const { container } = render(<HeroSection />)
    const links = container.querySelectorAll('a[aria-label]')
    expect(links.length).toBeGreaterThanOrEqual(2)
  })
})
