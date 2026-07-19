import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CompanyTimelineItem } from '@/components/features/historico/CompanyTimelineItem'
import type { HistoricoCompany } from '@/lib/historico/getHistoricoData'

const BASE_COMPANY: HistoricoCompany = {
  company: 'Acme Corp',
  company_initials: 'AC',
  company_tint: { bg: 'oklch(30% 0.20 320)', fg: 'oklch(98% 0.008 90)' },
  year_label: '2022–2024',
  roles: [{ role_title: 'Product Manager', period_label: 'jan 2022–jun 2024', year_label: '2022–2024' }],
  projects: [
    {
      name: 'Alpha',
      entries: [{ id: 'e1', what_i_did: 'Liderou o roadmap', impact: 'Aumentou retention 20%', metric: '20%', evidences: [] }],
    },
  ],
  highlight_bullets: ['Criou processo de discovery'],
}

describe('CompanyTimelineItem', () => {
  it('renders company initials badge', () => {
    render(<CompanyTimelineItem company={BASE_COMPANY} isLast={false} />)
    expect(screen.getByText('AC')).toBeInTheDocument()
  })

  it('renders year label', () => {
    render(<CompanyTimelineItem company={BASE_COMPANY} isLast={false} />)
    expect(screen.getByText('2022–2024')).toBeInTheDocument()
  })

  it('renders collapsed label with role and company for single role', () => {
    render(<CompanyTimelineItem company={BASE_COMPANY} isLast={false} />)
    expect(screen.getByText(/Product Manager · Acme Corp/)).toBeInTheDocument()
  })

  it('renders only company name in collapsed label for multiple roles', () => {
    const company: HistoricoCompany = {
      ...BASE_COMPANY,
      roles: [
        { role_title: 'Junior PM', period_label: '2021–2022', year_label: '2021–2022' },
        { role_title: 'Senior PM', period_label: '2022–atual', year_label: '2022–hoje' },
      ],
    }
    render(<CompanyTimelineItem company={company} isLast={false} />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('hides bullets and chips by default', () => {
    render(<CompanyTimelineItem company={BASE_COMPANY} isLast={false} />)
    expect(screen.queryByText('Criou processo de discovery')).not.toBeInTheDocument()
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
  })

  it('shows highlight_bullets after expanding', () => {
    render(<CompanyTimelineItem company={BASE_COMPANY} isLast={false} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Criou processo de discovery')).toBeInTheDocument()
  })

  it('shows role progression line when 2+ roles', () => {
    const company: HistoricoCompany = {
      ...BASE_COMPANY,
      roles: [
        { role_title: 'Junior PM', period_label: '2021–2022', year_label: '2021–2022' },
        { role_title: 'Senior PM', period_label: '2022–atual', year_label: '2022–hoje' },
      ],
    }
    render(<CompanyTimelineItem company={company} isLast={false} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/Junior PM/)).toBeInTheDocument()
    expect(screen.getByText(/Senior PM/)).toBeInTheDocument()
  })

  it('does not add bottom border when isLast is true', () => {
    const { container } = render(<CompanyTimelineItem company={BASE_COMPANY} isLast={true} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).not.toContain('border-b')
  })

  it('adds bottom border when isLast is false', () => {
    const { container } = render(<CompanyTimelineItem company={BASE_COMPANY} isLast={false} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('border-b')
  })

  it('collapses after second click', () => {
    render(<CompanyTimelineItem company={BASE_COMPANY} isLast={false} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(screen.getByText('Criou processo de discovery')).toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.queryByText('Criou processo de discovery')).not.toBeInTheDocument()
  })
})
