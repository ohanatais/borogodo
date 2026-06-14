import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { HighlightEntry } from '@/lib/panel/getPanelData'

import { TrajectoryHighlights } from '../TrajectoryHighlights'

const HIGHLIGHTS: HighlightEntry[] = [
  {
    id: 'h1',
    what_i_did: 'Implementei o sistema de pagamentos do zero.',
    impact: 'Zero incidentes em 6 meses',
    metric: '99.99% uptime',
    entry_date: '2025-06-01',
  },
  {
    id: 'h2',
    what_i_did: 'Liderou a migração do banco de dados sem downtime.',
    impact: 'Reduziu latência em 40%',
    metric: null,
    entry_date: '2025-03-15',
  },
]

describe('TrajectoryHighlights', () => {
  it('returns null when highlights is empty', () => {
    const { container } = render(<TrajectoryHighlights highlights={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders impact and metric joined by ·', () => {
    render(<TrajectoryHighlights highlights={[HIGHLIGHTS[0]]} />)
    expect(screen.getByText('Zero incidentes em 6 meses · 99.99% uptime')).toBeInTheDocument()
  })

  it('renders impact only when metric is null', () => {
    render(<TrajectoryHighlights highlights={[HIGHLIGHTS[1]]} />)
    expect(screen.getByText('Reduziu latência em 40%')).toBeInTheDocument()
    expect(screen.queryByText(/·/)).not.toBeInTheDocument()
  })

  it('renders what_i_did as secondary text', () => {
    render(<TrajectoryHighlights highlights={HIGHLIGHTS} />)
    expect(screen.getByText('Implementei o sistema de pagamentos do zero.')).toBeInTheDocument()
    expect(screen.getByText('Liderou a migração do banco de dados sem downtime.')).toBeInTheDocument()
  })

  it('truncates long what_i_did to 100 chars', () => {
    const longHighlight: HighlightEntry = {
      id: 'h-long',
      what_i_did: 'a'.repeat(150),
      impact: 'Impacto',
      metric: null,
      entry_date: null,
    }
    render(<TrajectoryHighlights highlights={[longHighlight]} />)
    expect(screen.getByText(/a+…/)).toBeInTheDocument()
    const el = screen.getByText(/a+…/)
    expect(el.textContent!.length).toBeLessThanOrEqual(105)
  })

  it('renders the section title via i18n key', () => {
    render(<TrajectoryHighlights highlights={HIGHLIGHTS} />)
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('renders all highlight items', () => {
    render(<TrajectoryHighlights highlights={HIGHLIGHTS} />)
    expect(screen.getAllByRole('generic').length).toBeGreaterThan(0)
    expect(screen.getByText('Zero incidentes em 6 meses · 99.99% uptime')).toBeInTheDocument()
    expect(screen.getByText('Reduziu latência em 40%')).toBeInTheDocument()
  })
})
