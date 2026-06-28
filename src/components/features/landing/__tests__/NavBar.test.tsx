import { render } from '@testing-library/react'
import { NavBar } from '../NavBar'

describe('NavBar', () => {
  it('has a discreet "Entrar" link to /login', () => {
    const { container } = render(<NavBar />)
    expect(container.querySelector('a[href="/login"]')).toBeInTheDocument()
  })

  it('does not contain a competing signup CTA', () => {
    const { container } = render(<NavBar />)
    expect(container.querySelector('a[href="/login?mode=signup"]')).not.toBeInTheDocument()
  })

  it('renders the section anchors', () => {
    const { container } = render(<NavBar />)
    expect(container.querySelector('a[href="#como-funciona"]')).toBeInTheDocument()
    expect(container.querySelector('a[href="#provas"]')).toBeInTheDocument()
    expect(container.querySelector('a[href="#privacidade"]')).toBeInTheDocument()
    expect(container.querySelector('a[href="#perguntas"]')).toBeInTheDocument()
  })
})
