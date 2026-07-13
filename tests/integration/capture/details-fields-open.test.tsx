import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.stubGlobal('fetch', mockFetch)

import { Drawer } from '@/components/features/capture/Drawer'

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
})

describe('Drawer — abrir "+ adicionar detalhes" (US4)', () => {
  it('abre a seção com campos vazios e não dispara nenhuma chamada de rede', () => {
    render(<Drawer open onOpenChange={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'detailsFields.toggleLabel' }))

    expect(screen.getByLabelText('detailsFields.metricLabel')).toHaveValue('')
    expect(screen.getByLabelText('detailsFields.impactLabel')).toHaveValue('')
    expect(screen.getByLabelText('detailsFields.tagsLabel')).toHaveValue('')
    expect(screen.getByLabelText('detailsFields.companyLabel')).toHaveValue('')
    expect(screen.getByLabelText('detailsFields.dateLabel')).toHaveValue('')

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('fechada por padrão — campos não aparecem antes do toggle', () => {
    render(<Drawer open onOpenChange={() => {}} />)

    expect(screen.queryByLabelText('detailsFields.metricLabel')).not.toBeInTheDocument()
  })
})
