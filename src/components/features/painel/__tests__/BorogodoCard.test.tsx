import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { PanelMirror } from '@/lib/panel/getPanelData'

import { BorogodoCard } from '../BorogodoCard'

const MIRROR: PanelMirror = {
  headline: 'Você estabiliza times em momentos críticos.',
  strengthThemes: ['liderança', 'calma sob pressão', 'mentoria'],
}

describe('BorogodoCard', () => {
  it('renders the first-name initial as avatar', () => {
    render(<BorogodoCard name="Ana Silva" mirror={MIRROR} entryCount={5} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders first name in heading, full name as subtitle', () => {
    render(<BorogodoCard name="Ana Silva" mirror={MIRROR} entryCount={5} />)
    // heading shows first name inside em; full name shown as subtitle paragraph
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.textContent).toContain('Ana')
    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
  })

  it('renders specialty chips from strengthThemes when hasData', () => {
    render(<BorogodoCard name="Ana" mirror={MIRROR} entryCount={5} />)
    expect(screen.getAllByText('liderança')).toHaveLength(2) // chip + skill pill (both lists use same themes)
  })

  it('renders the career pattern headline', () => {
    render(<BorogodoCard name="Ana" mirror={MIRROR} entryCount={5} />)
    expect(screen.getByText('Você estabiliza times em momentos críticos.')).toBeInTheDocument()
  })

  it('renders the view-mirror link (via i18n key)', () => {
    render(<BorogodoCard name="Ana" mirror={MIRROR} entryCount={5} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/espelho')
    expect(link.textContent).toBe('viewMirror')
  })

  it('shows empty state when mirror is null', () => {
    render(<BorogodoCard name="Ana" mirror={null} entryCount={0} />)
    // h2 heading renders formingOf + name + formingSuffix (mixed content)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.textContent).toMatch(/formingOf/)
    expect(screen.getByText('formingSubtitle')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows empty state when entryCount < 3 even with mirror', () => {
    render(<BorogodoCard name="Ana" mirror={MIRROR} entryCount={2} />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.textContent).toMatch(/formingOf/)
  })

  it('shows empty state when entryCount is exactly 2', () => {
    render(<BorogodoCard name="Ana" mirror={MIRROR} entryCount={2} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders content when entryCount is exactly 3', () => {
    render(<BorogodoCard name="Ana" mirror={MIRROR} entryCount={3} />)
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('limits specialty chips to 5', () => {
    const mirror: PanelMirror = {
      headline: null,
      strengthThemes: ['a', 'b', 'c', 'd', 'e', 'f'],
    }
    render(<BorogodoCard name="Ana" mirror={mirror} entryCount={5} />)
    // chips: slice(0,5) → a–e visible; skill pills: slice(0,3) → a–c; 'f' not shown anywhere
    expect(screen.getByText('e')).toBeInTheDocument()
    expect(screen.queryByText('f')).not.toBeInTheDocument()
  })

  it('renders fallback initial "?" when name is empty', () => {
    render(<BorogodoCard name="" mirror={null} entryCount={0} />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})
