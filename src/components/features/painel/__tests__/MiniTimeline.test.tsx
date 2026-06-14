import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { TimelineEntry } from '@/lib/panel/getPanelData'

import { MiniTimeline } from '../MiniTimeline'

const ENTRIES: TimelineEntry[] = [
  { id: 'e1', role_title: 'Engenheira Sênior', company: 'Nubank', entry_date: '2023-06-01' },
  { id: 'e2', role_title: 'PM', company: 'iFood', entry_date: '2021-03-10' },
  { id: 'e3', role_title: 'Analista', company: 'Acme', entry_date: '2019-01-01' },
]

describe('MiniTimeline', () => {
  it('returns null (renders nothing) when entries is empty', () => {
    const { container } = render(<MiniTimeline entries={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders role_title and company joined with dot separator', () => {
    render(<MiniTimeline entries={ENTRIES} />)
    expect(screen.getByText('Engenheira Sênior · Nubank')).toBeInTheDocument()
    expect(screen.getByText('PM · iFood')).toBeInTheDocument()
    expect(screen.getByText('Analista · Acme')).toBeInTheDocument()
  })

  it('renders year extracted from entry_date', () => {
    render(<MiniTimeline entries={[ENTRIES[0]]} />)
    expect(screen.getByText('2023')).toBeInTheDocument()
  })

  it('renders the section title via i18n key', () => {
    render(<MiniTimeline entries={ENTRIES} />)
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('skips year when entry_date is null', () => {
    const entry: TimelineEntry = { id: 'e-null', role_title: 'PM', company: 'Co', entry_date: null }
    render(<MiniTimeline entries={[entry]} />)
    expect(screen.getByText('PM · Co')).toBeInTheDocument()
    expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument()
  })

  it('skips role line when both role_title and company are null', () => {
    const entry: TimelineEntry = { id: 'e-empty', role_title: null, company: null, entry_date: null }
    render(<MiniTimeline entries={[entry]} />)
    expect(screen.queryByText(/Nubank|iFood/)).not.toBeInTheDocument()
  })
})
