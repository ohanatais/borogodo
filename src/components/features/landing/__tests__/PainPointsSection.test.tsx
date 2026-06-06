import { render, screen } from '@testing-library/react'
import { PainPointsSection } from '../PainPointsSection'

describe('PainPointsSection', () => {
  it('renders exactly 4 pain point items', () => {
    render(<PainPointsSection />)
    const items = screen.getAllByRole('article')
    expect(items).toHaveLength(4)
  })

  it('does not use bullet list structure', () => {
    const { container } = render(<PainPointsSection />)
    expect(container.querySelector('ul')).not.toBeInTheDocument()
    expect(container.querySelector('li')).not.toBeInTheDocument()
  })
})
