import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { PanelMirror } from '@/lib/panel/getPanelData'

import { BorogodoCard } from '../BorogodoCard'

const MIRROR: PanelMirror = {
  headline: 'Você estabiliza times em momentos críticos.',
  strengthThemes: ['liderança', 'calma sob pressão', 'mentoria'],
  skillSummary: null,
}

describe('BorogodoCard', () => {
  it('renders the first-name initial as avatar', () => {
    render(<BorogodoCard name="Ana Silva" mirror={MIRROR} entryCount={5} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders first name in the identity eyebrow', () => {
    render(<BorogodoCard name="Ana Silva" mirror={MIRROR} entryCount={5} />)
    // hasData no longer uses an h2 — the name steps back into a caption so the headline leads
    expect(screen.getByText('Ana')).toBeInTheDocument()
  })

  it('renders strength themes as a light caption when hasData', () => {
    render(<BorogodoCard name="Ana" mirror={MIRROR} entryCount={5} />)
    expect(screen.getByText(/liderança/)).toBeInTheDocument()
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

  it('shows mirror content when mirror is present, regardless of entryCount', () => {
    render(<BorogodoCard name="Ana" mirror={MIRROR} entryCount={2} />)
    // hasData renders the headline, not the forming heading
    expect(screen.getByText('Você estabiliza times em momentos críticos.')).toBeInTheDocument()
    expect(screen.queryByText('formingSubtitle')).not.toBeInTheDocument()
  })

  it('shows view-mirror link when mirror is present, regardless of entryCount', () => {
    render(<BorogodoCard name="Ana" mirror={MIRROR} entryCount={2} />)
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('renders content when entryCount is exactly 3', () => {
    render(<BorogodoCard name="Ana" mirror={MIRROR} entryCount={3} />)
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('limits strength themes to 3', () => {
    const mirror: PanelMirror = {
      headline: null,
      strengthThemes: ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta'],
      skillSummary: null,
    }
    render(<BorogodoCard name="Ana" mirror={mirror} entryCount={5} />)
    // themes are joined into one caption: slice(0,3) → alpha · beta · gamma; 'delta' onward dropped
    expect(screen.getByText('alpha · beta · gamma')).toBeInTheDocument()
    expect(screen.queryByText(/delta/)).not.toBeInTheDocument()
  })

  it('renders user icon when name is empty', () => {
    render(<BorogodoCard name="" mirror={null} entryCount={0} />)
    // No letter initial — the User icon is rendered (aria-hidden, no text)
    expect(screen.queryByText('?')).not.toBeInTheDocument()
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.textContent).toMatch(/formingSelf/)
  })
})
