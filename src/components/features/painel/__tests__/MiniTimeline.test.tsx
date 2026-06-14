import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { TimelineEntry } from '@/lib/panel/getPanelData'

import { MiniTimeline } from '../MiniTimeline'

const ENTRIES: TimelineEntry[] = [
  { id: 'e1', role_title: 'Engenheira Sênior', company: 'Nubank', start_date: '2023-06-01', end_date: '2025-01-15' },
  { id: 'e2', role_title: 'PM', company: 'iFood', start_date: '2021-03-10', end_date: '2023-05-01' },
  { id: 'e3', role_title: 'Analista', company: 'Acme', start_date: '2019-01-01', end_date: '2021-02-28' },
]

describe('MiniTimeline', () => {
  it('returns null (renders nothing) when entries is empty', () => {
    const { container } = render(<MiniTimeline entries={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders role_title for each entry', () => {
    render(<MiniTimeline entries={ENTRIES} />)
    expect(screen.getByText('Engenheira Sênior')).toBeInTheDocument()
    expect(screen.getByText('PM')).toBeInTheDocument()
    expect(screen.getByText('Analista')).toBeInTheDocument()
  })

  it('renders company on a separate line from role_title', () => {
    render(<MiniTimeline entries={ENTRIES} />)
    expect(screen.getByText('Nubank')).toBeInTheDocument()
    expect(screen.getByText('iFood')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
  })

  it('renders year range from start_date and end_date', () => {
    render(<MiniTimeline entries={[ENTRIES[0]]} />)
    expect(screen.getByText('2023–2025')).toBeInTheDocument()
  })

  it('renders the section title via i18n key', () => {
    render(<MiniTimeline entries={ENTRIES} />)
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('shows "atual" when end_date is within 6 months', () => {
    const recent = new Date()
    recent.setMonth(recent.getMonth() - 1)
    const entry: TimelineEntry = {
      id: 'e-current',
      role_title: 'PM Sênior',
      company: 'StartupX',
      start_date: '2023-01-01',
      end_date: recent.toISOString().slice(0, 10),
    }
    render(<MiniTimeline entries={[entry]} />)
    expect(screen.getByText(/atual/)).toBeInTheDocument()
  })

  it('skips period when both dates are null', () => {
    const entry: TimelineEntry = { id: 'e-null', role_title: 'PM', company: 'Co', start_date: null, end_date: null }
    render(<MiniTimeline entries={[entry]} />)
    expect(screen.getByText('PM')).toBeInTheDocument()
    expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument()
  })

  it('skips role and company lines when both are null', () => {
    const entry: TimelineEntry = { id: 'e-empty', role_title: null, company: null, start_date: null, end_date: null }
    render(<MiniTimeline entries={[entry]} />)
    expect(screen.queryByRole('listitem')).toBeInTheDocument() // li still renders
    expect(screen.queryByText(/Nubank|iFood/)).not.toBeInTheDocument()
  })
})
