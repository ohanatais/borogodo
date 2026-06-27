import { render } from '@testing-library/react'
import { CtaSection } from '../CtaSection'

describe('CtaSection', () => {
  it('has a single signup CTA to /login?mode=signup', () => {
    const { container } = render(<CtaSection />)
    expect(container.querySelector('a[href="/login?mode=signup"]')).toBeInTheDocument()
  })

  it('does not render a secondary "Entrar" link (single CTA)', () => {
    const { container } = render(<CtaSection />)
    expect(container.querySelector('a[href="/login"]')).not.toBeInTheDocument()
  })

  it('has exactly one link (single CTA)', () => {
    const { container } = render(<CtaSection />)
    expect(container.querySelectorAll('a')).toHaveLength(1)
  })
})
