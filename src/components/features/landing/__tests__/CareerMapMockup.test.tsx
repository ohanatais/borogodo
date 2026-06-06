import { render, screen } from '@testing-library/react'
import { CareerMapMockup } from '../CareerMapMockup'

describe('CareerMapMockup', () => {
  it('renders the profile label', () => {
    render(<CareerMapMockup />)
    expect(screen.getAllByText(/Líder técnica/)[0]).toBeInTheDocument()
  })

  it('renders at least 2 skill clusters with labels', () => {
    render(<CareerMapMockup />)
    expect(screen.getByText('Liderança')).toBeInTheDocument()
    expect(screen.getByText('Produto')).toBeInTheDocument()
  })

  it('renders at least 2 timeline entries', () => {
    render(<CareerMapMockup />)
    expect(screen.getByText('2019')).toBeInTheDocument()
    expect(screen.getByText('2021')).toBeInTheDocument()
  })
})
