import { render, screen } from '@testing-library/react'
import { ContentGenSection } from '../ContentGenSection'

describe('ContentGenSection', () => {
  it('renders a label for the real post column', () => {
    const { container } = render(<ContentGenSection />)
    const labels = container.querySelectorAll('[class*="uppercase"]')
    expect(labels.length).toBeGreaterThanOrEqual(2)
  })

  it('renders the "real" post fixture text', () => {
    render(<ContentGenSection />)
    expect(screen.getByText(/Três anos atrás/)).toBeInTheDocument()
  })

  it('renders the "generic" post fixture text', () => {
    render(<ContentGenSection />)
    expect(screen.getByText(/liderança eficaz/i)).toBeInTheDocument()
  })

  it('has no stock images', () => {
    const { container } = render(<ContentGenSection />)
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })
})
