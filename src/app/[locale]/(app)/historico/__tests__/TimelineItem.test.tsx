import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TimelineItem } from '@/components/features/historico/TimelineItem'
import type { HistoricoPosition } from '@/lib/historico/getHistoricoData'

const BASE_POSITION: HistoricoPosition = {
  role_title: 'Product Manager',
  company: 'Acme Corp',
  company_initials: 'AC',
  company_tint: { bg: 'oklch(30% 0.20 320)', fg: 'oklch(98% 0.008 90)' },
  role_start: '2022-01-01',
  role_end: '2024-06-01',
  period_label: 'jan 2022–jun 2024',
  year_label: '2022–2024',
  entries: [
    { what_i_did: 'Liderou o roadmap', impact: 'Aumentou retention 20%', metric: '20%' },
    { what_i_did: 'Criou processo de discovery', impact: null, metric: null },
  ],
}

describe('TimelineItem', () => {
  it('renders role title and company', () => {
    render(<TimelineItem position={BASE_POSITION} isLast={false} />)
    expect(screen.getByText('Product Manager')).toBeInTheDocument()
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument()
  })

  it('renders company initials', () => {
    render(<TimelineItem position={BASE_POSITION} isLast={false} />)
    expect(screen.getByText('AC')).toBeInTheDocument()
  })

  it('renders period label', () => {
    render(<TimelineItem position={BASE_POSITION} isLast={false} />)
    expect(screen.getByText('jan 2022–jun 2024')).toBeInTheDocument()
  })

  it('renders year label', () => {
    render(<TimelineItem position={BASE_POSITION} isLast={false} />)
    expect(screen.getByText('2022–2024')).toBeInTheDocument()
  })

  it('renders bullet entries', () => {
    render(<TimelineItem position={BASE_POSITION} isLast={false} />)
    expect(screen.getByText(/Liderou o roadmap/)).toBeInTheDocument()
    expect(screen.getByText(/Criou processo de discovery/)).toBeInTheDocument()
  })

  it('concatenates impact and metric into bullet text', () => {
    render(<TimelineItem position={BASE_POSITION} isLast={false} />)
    expect(screen.getByText(/Aumentou retention 20%/)).toBeInTheDocument()
    expect(screen.getByText(/20%/)).toBeInTheDocument()
  })

  it('shows evidências chip after expanding', () => {
    render(<TimelineItem position={BASE_POSITION} isLast={false} />)
    expect(screen.queryByText(/Evidências/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /product manager/i }))
    expect(screen.getByText(/Evidências \(em breve\)/)).toBeInTheDocument()
  })

  it('collapses after second click', () => {
    render(<TimelineItem position={BASE_POSITION} isLast={false} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(screen.getByText(/Evidências/)).toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.queryByText(/Evidências/)).not.toBeInTheDocument()
  })

  it('renders nothing special when entries is empty', () => {
    const position = { ...BASE_POSITION, entries: [] }
    render(<TimelineItem position={position} isLast={true} />)
    expect(screen.getByText('Product Manager')).toBeInTheDocument()
  })

  it('does not add bottom border when isLast is true', () => {
    const { container } = render(<TimelineItem position={BASE_POSITION} isLast={true} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).not.toContain('border-b')
  })

  it('adds bottom border when isLast is false', () => {
    const { container } = render(<TimelineItem position={BASE_POSITION} isLast={false} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('border-b')
  })
})
