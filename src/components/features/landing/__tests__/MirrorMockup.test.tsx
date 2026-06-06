import { render, screen } from '@testing-library/react'
import { MirrorMockup } from '../MirrorMockup'

describe('MirrorMockup', () => {
  it('renders the pattern text', () => {
    render(<MirrorMockup />)
    expect(screen.getByText(/Você lidera melhor/)).toBeInTheDocument()
  })

  it('renders at least 2 evidence items', () => {
    render(<MirrorMockup />)
    const evidenceItems = screen.getAllByRole('listitem')
    expect(evidenceItems.length).toBeGreaterThanOrEqual(2)
  })

  it('renders the insight sentence', () => {
    render(<MirrorMockup />)
    expect(screen.getByText(/diferencial/i)).toBeInTheDocument()
  })
})
