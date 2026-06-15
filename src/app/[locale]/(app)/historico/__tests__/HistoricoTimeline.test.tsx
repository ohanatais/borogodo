import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HistoricoTimeline } from '@/components/features/historico/HistoricoTimeline'
import type { HistoricoData } from '@/lib/historico/getHistoricoData'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const COMPANY = {
  company: 'Beta Inc',
  company_initials: 'BI',
  company_tint: { bg: 'oklch(45% 0.10 190)', fg: 'oklch(98% 0.008 90)' },
  year_label: '2020–2023',
  roles: [{ role_title: 'Engineering Manager', period_label: 'jun 2020–jan 2023', year_label: '2020–2023' }],
  projects: [],
  highlight_bullets: ['Montou o time de engenharia'],
}

const noop = () => undefined

describe('HistoricoTimeline', () => {
  it('renders the headline', () => {
    const data: HistoricoData = { companies: [COMPANY] }
    render(<HistoricoTimeline data={data} activeProject={null} onSelectProject={noop} onCloseProject={noop} onStartCapture={noop} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/fio da/)
  })

  it('renders the subtitle', () => {
    const data: HistoricoData = { companies: [COMPANY] }
    render(<HistoricoTimeline data={data} activeProject={null} onSelectProject={noop} onCloseProject={noop} onStartCapture={noop} />)
    expect(screen.getByText(/Cada passo/)).toBeInTheDocument()
  })

  it('renders all companies', () => {
    const data: HistoricoData = { companies: [COMPANY] }
    render(<HistoricoTimeline data={data} activeProject={null} onSelectProject={noop} onCloseProject={noop} onStartCapture={noop} />)
    expect(screen.getByText(/Beta Inc/)).toBeInTheDocument()
  })

  it('renders empty state when no companies', () => {
    const data: HistoricoData = { companies: [] }
    render(<HistoricoTimeline data={data} activeProject={null} onSelectProject={noop} onCloseProject={noop} onStartCapture={noop} />)
    expect(screen.getByText(/Nenhuma entrada/)).toBeInTheDocument()
    expect(screen.getByText(/Conte histórias/)).toBeInTheDocument()
  })

  it('does not render timeline list when empty', () => {
    const data: HistoricoData = { companies: [] }
    render(<HistoricoTimeline data={data} activeProject={null} onSelectProject={noop} onCloseProject={noop} onStartCapture={noop} />)
    expect(screen.queryByText('Beta Inc')).not.toBeInTheDocument()
  })

  it('renders ProjectDetailPanel when activeProject is set', () => {
    const data: HistoricoData = { companies: [COMPANY] }
    const project = {
      name: 'Alpha',
      entries: [{ id: 'e1', what_i_did: 'Entrega X', impact: null, metric: null, evidences: [] }],
    }
    render(
      <HistoricoTimeline
        data={data}
        activeProject={{ company: 'Beta Inc', project }}
        onSelectProject={noop}
        onCloseProject={noop}
        onStartCapture={noop}
      />
    )
    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0)
  })

  it('calls onCloseProject from ProjectDetailPanel close button', () => {
    const onClose = vi.fn()
    const data: HistoricoData = { companies: [COMPANY] }
    const project = { name: 'Alpha', entries: [] }
    render(
      <HistoricoTimeline
        data={data}
        activeProject={{ company: 'Beta Inc', project }}
        onSelectProject={noop}
        onCloseProject={onClose}
        onStartCapture={noop}
      />
    )
    const closeBtns = screen.getAllByRole('button', { name: /fechar/i })
    closeBtns[0].click()
    expect(onClose).toHaveBeenCalled()
  })
})
