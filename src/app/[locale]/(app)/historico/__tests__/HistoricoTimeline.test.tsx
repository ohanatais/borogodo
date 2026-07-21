import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HistoricoTimeline } from '@/components/features/historico/HistoricoTimeline'
import type { HistoricoData } from '@/lib/historico/getHistoricoData'
import { OPEN_DRAWER_EVENT } from '@/components/features/painel/registroTriggerEvents'

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
  it('leaves the page heading to the Trajectory page shell', () => {
    const data: HistoricoData = { companies: [COMPANY] }
    render(<HistoricoTimeline data={data} />)
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
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

  it('opens the capture drawer from the empty state', () => {
    const onOpen = vi.fn()
    window.addEventListener(OPEN_DRAWER_EVENT, onOpen)
    render(<HistoricoTimeline data={{ companies: [] }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Registrar agora' }))

    expect(onOpen).toHaveBeenCalledOnce()
    window.removeEventListener(OPEN_DRAWER_EVENT, onOpen)
  })

})
