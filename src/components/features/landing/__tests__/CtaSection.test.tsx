import { render } from '@testing-library/react'
import { CtaSection } from '../CtaSection'

describe('CtaSection', () => {
  it('T029: "Criar conta" links to /login?mode=signup', () => {
    const { container } = render(<CtaSection />)
    expect(container.querySelector('a[href="/login?mode=signup"]')).toBeInTheDocument()
  })

  it('T029: "Já tenho conta" links to /login', () => {
    const { container } = render(<CtaSection />)
    expect(container.querySelector('a[href="/login"]')).toBeInTheDocument()
  })

  it('has no form or input elements', () => {
    const { container } = render(<CtaSection />)
    expect(container.querySelector('form')).not.toBeInTheDocument()
    expect(container.querySelector('input')).not.toBeInTheDocument()
  })
})
