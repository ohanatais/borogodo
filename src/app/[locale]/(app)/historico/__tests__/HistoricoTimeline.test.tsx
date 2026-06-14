import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HistoricoTimeline } from '@/components/features/historico/HistoricoTimeline'
import type { HistoricoData } from '@/lib/historico/getHistoricoData'

const POSITION = {
  role_title: 'Engineering Manager',
  company: 'Beta Inc',
  company_initials: 'BI',
  company_tint: { bg: 'oklch(45% 0.10 190)', fg: 'oklch(98% 0.008 90)' },
  role_start: '2020-06-01',
  role_end: '2023-01-01',
  period_label: 'jun 2020–jan 2023',
  year_label: '2020–2023',
  entries: [{ what_i_did: 'Montou o time de engenharia', impact: null, metric: null }],
}

describe('HistoricoTimeline', () => {
  it('renders the headline', () => {
    const data: HistoricoData = { positions: [POSITION] }
    render(<HistoricoTimeline data={data} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/fio da/)
  })

  it('renders the subtitle', () => {
    const data: HistoricoData = { positions: [POSITION] }
    render(<HistoricoTimeline data={data} />)
    expect(screen.getByText(/Cada passo/)).toBeInTheDocument()
  })

  it('renders all positions', () => {
    const data: HistoricoData = { positions: [POSITION] }
    render(<HistoricoTimeline data={data} />)
    expect(screen.getByText('Engineering Manager')).toBeInTheDocument()
    expect(screen.getByText(/Beta Inc/)).toBeInTheDocument()
  })

  it('renders empty state when no positions', () => {
    const data: HistoricoData = { positions: [] }
    render(<HistoricoTimeline data={data} />)
    expect(screen.getByText(/Nenhuma entrada/)).toBeInTheDocument()
    expect(screen.getByText(/Conte histórias/)).toBeInTheDocument()
  })

  it('does not render timeline list when empty', () => {
    const data: HistoricoData = { positions: [] }
    render(<HistoricoTimeline data={data} />)
    expect(screen.queryByText('Engineering Manager')).not.toBeInTheDocument()
  })
})
