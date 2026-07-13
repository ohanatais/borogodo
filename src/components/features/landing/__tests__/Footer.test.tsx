import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/support/channels', () => ({
  SUPPORT_EMAIL: 'admin@borogodo.ai',
  LINKEDIN_URL: 'https://www.linkedin.com/in/ohana-ta%C3%ADs/',
}))

import { Footer } from '../Footer'

describe('Footer', () => {
  it('renders the ContactCard with the support email', () => {
    render(<Footer />)
    expect(screen.getByText('admin@borogodo.ai')).toBeInTheDocument()
  })

  it('renders the contentinfo landmark', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders links to the terms of use and privacy policy pages', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'termsLabel' })).toHaveAttribute('href', '/termos-de-uso')
    expect(screen.getByRole('link', { name: 'privacyLabel' })).toHaveAttribute('href', '/politica-de-privacidade')
  })
})
