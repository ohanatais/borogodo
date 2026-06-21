import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('shows only the title collapsed; detail (metric + impact) is hidden until expanded', () => {
    render(<TrajectoryHighlights highlights={[HIGHLIGHTS[0]]} />)
    expect(screen.getByText('Implementei o sistema de pagamentos do zero.')).toBeInTheDocument()
    expect(screen.queryByText('99.99% uptime')).not.toBeInTheDocument()
    expect(screen.queryByText('Zero incidentes em 6 meses')).not.toBeInTheDocument()
  })

  it('reveals metric and impact after expanding the item', async () => {
    const user = userEvent.setup()
    render(<TrajectoryHighlights highlights={[HIGHLIGHTS[0]]} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('99.99% uptime')).toBeInTheDocument()
    expect(screen.getByText('Zero incidentes em 6 meses')).toBeInTheDocument()
  })

  it('reveals only impact when metric is null', async () => {
    const user = userEvent.setup()
    render(<TrajectoryHighlights highlights={[HIGHLIGHTS[1]]} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Reduziu latência em 40%')).toBeInTheDocument()
  })

  it('toggles aria-expanded on the row button', async () => {
    const user = userEvent.setup()
    render(<TrajectoryHighlights highlights={[HIGHLIGHTS[0]]} />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders every highlight title as a row', () => {
    render(<TrajectoryHighlights highlights={HIGHLIGHTS} />)
    expect(screen.getByText('Implementei o sistema de pagamentos do zero.')).toBeInTheDocument()
    expect(screen.getByText('Liderou a migração do banco de dados sem downtime.')).toBeInTheDocument()
  })

  it('renders the section title via i18n key', () => {
    render(<TrajectoryHighlights highlights={HIGHLIGHTS} />)
    expect(screen.getByText('title')).toBeInTheDocument()
  })
})
