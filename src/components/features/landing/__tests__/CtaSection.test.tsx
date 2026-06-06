import { render } from '@testing-library/react'
import { CtaSection } from '../CtaSection'

describe('CtaSection', () => {
  it('"Criar conta" links to /sign-up', () => {
    const { container } = render(<CtaSection />)
    expect(container.querySelector('a[href="/sign-up"]')).toBeInTheDocument()
  })

  it('"Já tenho conta" links to /sign-in', () => {
    const { container } = render(<CtaSection />)
    expect(container.querySelector('a[href="/sign-in"]')).toBeInTheDocument()
  })

  it('has no form or input elements', () => {
    const { container } = render(<CtaSection />)
    expect(container.querySelector('form')).not.toBeInTheDocument()
    expect(container.querySelector('input')).not.toBeInTheDocument()
  })
})
