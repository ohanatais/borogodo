import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRecordTermsAcceptance = vi.hoisted(() => vi.fn())
const mockRouterPush = vi.hoisted(() => vi.fn())

vi.mock('@/lib/actions/consent', () => ({
  recordTermsAcceptance: mockRecordTermsAcceptance,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

import { ConsentGate } from '../ConsentGate'

describe('ConsentGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the bump title when the account already accepted an earlier version', () => {
    render(<ConsentGate hasAcceptedBefore />)
    expect(screen.getByText('titleBump')).toBeInTheDocument()
  })

  it('shows the stale title when the account never accepted (pre-dates the feature)', () => {
    render(<ConsentGate hasAcceptedBefore={false} />)
    expect(screen.getByText('titleStale')).toBeInTheDocument()
  })

  it('renders links to the legal pages', () => {
    render(<ConsentGate hasAcceptedBefore />)
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/termos-de-uso')
    expect(hrefs).toContain('/politica-de-privacidade')
  })

  it('opens the legal links in a new tab (does not lose the consent screen)', () => {
    render(<ConsentGate hasAcceptedBefore />)
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank')
    }
  })

  it('calls recordTermsAcceptance and redirects to /painel on submit', async () => {
    mockRecordTermsAcceptance.mockResolvedValue({ success: true })
    render(<ConsentGate hasAcceptedBefore />)
    fireEvent.click(screen.getByRole('button', { name: 'submit' }))
    await waitFor(() => {
      expect(mockRecordTermsAcceptance).toHaveBeenCalledTimes(1)
      expect(mockRouterPush).toHaveBeenCalledWith('/painel')
    })
  })

  it('shows an error and stays on the screen when recording fails', async () => {
    mockRecordTermsAcceptance.mockResolvedValue({ success: false, error: 'boom' })
    render(<ConsentGate hasAcceptedBefore />)
    fireEvent.click(screen.getByRole('button', { name: 'submit' }))
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})
