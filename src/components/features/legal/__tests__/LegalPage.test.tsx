import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LegalPage } from '../LegalPage'

const sections = [
  { heading: '1. Aceite', body: 'Corpo do texto 1' },
  { heading: '2. Uso', body: 'Corpo do texto 2' },
]

describe('LegalPage', () => {
  it('renders the page title', () => {
    render(<LegalPage namespace="termsPage" sections={sections} />)
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('renders the current version label', () => {
    render(<LegalPage namespace="termsPage" sections={sections} />)
    expect(screen.getByText('versionLabel')).toBeInTheDocument()
  })

  it('renders every section heading and body', () => {
    render(<LegalPage namespace="termsPage" sections={sections} />)
    sections.forEach((section) => {
      expect(screen.getByText(section.heading)).toBeInTheDocument()
      expect(screen.getByText(section.body)).toBeInTheDocument()
    })
  })

  it('renders correct heading hierarchy: one h1, then one h2 per section', () => {
    render(<LegalPage namespace="termsPage" sections={sections} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(sections.length)
  })

  it('renders a link back to home', () => {
    render(<LegalPage namespace="termsPage" sections={sections} />)
    expect(screen.getByText('backToHome')).toBeInTheDocument()
  })
})
