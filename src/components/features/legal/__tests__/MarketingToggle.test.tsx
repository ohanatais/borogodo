import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSetMarketingConsent = vi.hoisted(() => vi.fn())

vi.mock('@/lib/actions/consent', () => ({
  setMarketingConsent: mockSetMarketingConsent,
}))

import { MarketingToggle } from '../MarketingToggle'

describe('MarketingToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reflects the current value when off', () => {
    render(<MarketingToggle initialValue={false} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('reflects the current value when on', () => {
    render(<MarketingToggle initialValue />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls setMarketingConsent with the new value when toggled', async () => {
    mockSetMarketingConsent.mockResolvedValue({ success: true })
    render(<MarketingToggle initialValue={false} />)
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => {
      expect(mockSetMarketingConsent).toHaveBeenCalledWith(true)
    })
  })

  it('rolls back to the previous value when the save fails', async () => {
    mockSetMarketingConsent.mockResolvedValue({ success: false, error: 'boom' })
    render(<MarketingToggle initialValue={false} />)
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => {
      expect(screen.getByRole('checkbox')).not.toBeChecked()
    })
  })
})
