import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { RecentEntries } from '../RecentEntries'

const ENTRIES = [
  { id: 'e1', what_i_did: 'Mediou um conflito entre áreas', source: 'text' as const, entry_date: '2026-06-05', created_at: '2026-06-05T10:00:00Z' },
  { id: 'e2', what_i_did: 'Gravou um áudio sobre a entrega', source: 'audio' as const, entry_date: '2026-06-04', created_at: '2026-06-04T10:00:00Z' },
  { id: 'e3', what_i_did: 'Importou o currículo em PDF', source: 'linkedin_pdf' as const, entry_date: '2026-06-03', created_at: '2026-06-03T10:00:00Z' },
  { id: 'e4', what_i_did: 'Anexou um print da apresentação', source: 'image' as const, entry_date: '2026-06-02', created_at: '2026-06-02T10:00:00Z' },
]

describe('RecentEntries', () => {
  it('renders at most 3 entries with an icon per source', () => {
    render(<RecentEntries entries={ENTRIES} />)

    expect(screen.getByText('Mediou um conflito entre áreas')).toBeInTheDocument()
    expect(screen.getByText('Gravou um áudio sobre a entrega')).toBeInTheDocument()
    expect(screen.getByText('Importou o currículo em PDF')).toBeInTheDocument()
    expect(screen.queryByText('Anexou um print da apresentação')).not.toBeInTheDocument()

    expect(screen.getByText('📝')).toBeInTheDocument()
    expect(screen.getByText('🎙️')).toBeInTheDocument()
    expect(screen.getByText('📄')).toBeInTheDocument()
  })

  it('does not render when there are no entries', () => {
    const { container } = render(<RecentEntries entries={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('expands an entry in place when clicked', async () => {
    const user = userEvent.setup()
    render(<RecentEntries entries={ENTRIES} />)

    const button = screen.getByRole('button', { name: /Mediou um conflito entre áreas/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
  })
})
