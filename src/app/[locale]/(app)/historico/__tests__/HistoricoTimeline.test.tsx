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

describe('HistoricoTimeline', () => {
  it('renders the headline', () => {
    const data: HistoricoData = { companies: [COMPANY] }
    render(<HistoricoTimeline data={data} />)
    // h2: a Trajetória é uma vista do Espelho (segmented control), não uma página própria — o
    // intro deixou de ser page-title (h1) pra não duplicar título logo abaixo do toggle (021).
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/fio da/)
  })

  it('renders the subtitle', () => {
    const data: HistoricoData = { companies: [COMPANY] }
    render(<HistoricoTimeline data={data} />)
    expect(screen.getByText(/Cada passo/)).toBeInTheDocument()
  })

  it('renders all companies', () => {
    const data: HistoricoData = { companies: [COMPANY] }
    render(<HistoricoTimeline data={data} />)
    expect(screen.getByText(/Beta Inc/)).toBeInTheDocument()
  })

  it('renders empty state when no companies', () => {
    const data: HistoricoData = { companies: [] }
    render(<HistoricoTimeline data={data} />)
    expect(screen.getByText(/Seu fio ainda está em branco/)).toBeInTheDocument()
    expect(screen.getByText(/Conte uma história/)).toBeInTheDocument()
  })

  it('does not render timeline list when empty', () => {
    const data: HistoricoData = { companies: [] }
    render(<HistoricoTimeline data={data} />)
    expect(screen.queryByText('Beta Inc')).not.toBeInTheDocument()
  })

})
