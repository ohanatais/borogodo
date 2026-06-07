import { render } from '@testing-library/react'
import { NavBar } from '../NavBar'

describe('NavBar', () => {
  it('T027: CTA href is /login?mode=signup', () => {
    const { container } = render(<NavBar />)
    const link = container.querySelector('a[href="/login?mode=signup"]')
    expect(link).toBeInTheDocument()
  })

  it('does not link to /sign-up', () => {
    const { container } = render(<NavBar />)
    expect(container.querySelector('a[href="/sign-up"]')).not.toBeInTheDocument()
  })
})
