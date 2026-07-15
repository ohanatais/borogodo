import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LegalLinksCard } from '../LegalLinksCard'

describe('LegalLinksCard', () => {
  it('renders links to the terms of use and privacy policy pages', () => {
    render(
      <LegalLinksCard marketingConsent={false} termsVersion="2026-07" termsAcceptedAt="2026-07-01T00:00:00.000Z" />
    )
    expect(screen.getByRole('link', { name: 'termsLabel' })).toHaveAttribute('href', '/termos-de-uso')
    expect(screen.getByRole('link', { name: 'privacyLabel' })).toHaveAttribute('href', '/politica-de-privacidade')
  })

  it('opens the legal links in a new tab (does not lose the configuracoes screen)', () => {
    render(
      <LegalLinksCard marketingConsent={false} termsVersion="2026-07" termsAcceptedAt="2026-07-01T00:00:00.000Z" />
    )
    expect(screen.getByRole('link', { name: 'termsLabel' })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'privacyLabel' })).toHaveAttribute('target', '_blank')
  })

  it('renders the section heading', () => {
    render(
      <LegalLinksCard marketingConsent={false} termsVersion="2026-07" termsAcceptedAt="2026-07-01T00:00:00.000Z" />
    )
    expect(screen.getByText('heading')).toBeInTheDocument()
  })

  it('renders the "accepted terms on" line when terms_accepted_at is present', () => {
    render(
      <LegalLinksCard marketingConsent={false} termsVersion="2026-07" termsAcceptedAt="2026-07-01T00:00:00.000Z" />
    )
    expect(screen.getByText('acceptedOn')).toBeInTheDocument()
  })

  it('does not render the "accepted terms on" line when terms_accepted_at is null', () => {
    render(<LegalLinksCard marketingConsent={false} termsVersion={null} termsAcceptedAt={null} />)
    expect(screen.queryByText('acceptedOn')).not.toBeInTheDocument()
  })

  it('renders the marketing toggle reflecting the current value', () => {
    render(<LegalLinksCard marketingConsent termsVersion="2026-07" termsAcceptedAt="2026-07-01T00:00:00.000Z" />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
