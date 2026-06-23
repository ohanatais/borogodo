import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Controla as constantes de canal por teste (LinkedIn ausente vs presente).
const mockChannels = vi.hoisted(() => ({
  SUPPORT_EMAIL: 'admin@borogodo.ai',
  LINKEDIN_URL: 'https://www.linkedin.com/in/ohana-ta%C3%ADs/',
}))

vi.mock('@/lib/support/channels', () => mockChannels)

import { ContactCard } from '../ContactCard'

describe('ContactCard', () => {
  it('renders the support email as selectable text (US1, FR-001)', () => {
    render(<ContactCard />)
    expect(screen.getByText('admin@borogodo.ai')).toBeInTheDocument()
  })

  it('includes the copy button (US1, FR-002)', () => {
    render(<ContactCard />)
    expect(screen.getByRole('button', { name: /copyButton/i })).toBeInTheDocument()
  })

  it('does not render a mailto link as the primary gesture (US1, FR-003)', () => {
    const { container } = render(<ContactCard />)
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull()
  })

  it('renders the LinkedIn link in a new tab when configured (US2, FR-005)', () => {
    render(<ContactCard />)
    const link = screen.getByRole('link', { name: /linkedinCta/i })
    expect(link).toHaveAttribute('href', mockChannels.LINKEDIN_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the SLA microcopy (US3, FR-007)', () => {
    render(<ContactCard />)
    expect(screen.getByText('sla')).toBeInTheDocument()
  })
})

describe('ContactCard without LinkedIn configured', () => {
  it('omits the LinkedIn link when the URL is empty (US2 edge case)', () => {
    mockChannels.LINKEDIN_URL = ''
    render(<ContactCard />)
    expect(screen.queryByRole('link', { name: /linkedinCta/i })).toBeNull()
    // restaura para os outros testes
    mockChannels.LINKEDIN_URL = 'https://www.linkedin.com/in/ohana-ta%C3%ADs/'
  })
})
