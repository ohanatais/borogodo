import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.stubGlobal('fetch', mockFetch)

import { Drawer } from '@/components/features/capture/Drawer'

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response
}

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
})

describe('Drawer — "Organizar" antes de salvar (revisão de UX pós-implementação, 026)', () => {
  it('chama /api/capture/organize-preview e preenche os campos manuais vazios com o resultado', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        status: 'organized',
        highlights: [{ metric: 'aceite em 2 ciclos', impact: 'reduziu retrabalho', tags: ['discovery', 'produto'] }],
        company: 'Acme',
        entry_date: '2026-03-01',
      })
    )

    render(<Drawer open onOpenChange={() => {}} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' }), {
      target: { value: 'fiz o discovery e o cliente aceitou em 2 ciclos' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'organize.cta' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/capture/organize-preview',
        expect.objectContaining({ method: 'POST' })
      )
    })

    // A seção de detalhes abre sozinha mostrando o que foi preenchido.
    await waitFor(() => expect(screen.getByLabelText('detailsFields.metricLabel')).toHaveValue('aceite em 2 ciclos'))
    expect(screen.getByLabelText('detailsFields.impactLabel')).toHaveValue('reduziu retrabalho')
    // Tags preenchidas viram pílulas (com X pra remover), não texto no campo de digitar a próxima.
    expect(screen.getByText('discovery')).toBeInTheDocument()
    expect(screen.getByText('produto')).toBeInTheDocument()
    expect(screen.getByLabelText('detailsFields.companyLabel')).toHaveValue('Acme')
    expect(screen.getByLabelText('detailsFields.dateLabel')).toHaveValue('2026-03-01')
  })

  it('não sobrescreve um campo já preenchido manualmente (mesma regra "só preenche vazios")', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        status: 'organized',
        highlights: [{ metric: 'aceite em 2 ciclos', impact: null, tags: [] }],
        company: null,
        entry_date: null,
      })
    )

    render(<Drawer open onOpenChange={() => {}} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' }), {
      target: { value: 'texto qualquer' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'detailsFields.toggleLabel' }))
    fireEvent.change(screen.getByLabelText('detailsFields.metricLabel'), { target: { value: 'métrica que eu digitei' } })

    fireEvent.click(screen.getByRole('button', { name: 'organize.cta' }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())

    expect(screen.getByLabelText('detailsFields.metricLabel')).toHaveValue('métrica que eu digitei')
  })

  it('botão fica desabilitado sem texto no rascunho', () => {
    render(<Drawer open onOpenChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'organize.cta' })).toBeDisabled()
  })

  it('falha silenciosa — sem popup, botão volta ao estado normal (FR-030)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ status: 'failed' }))

    render(<Drawer open onOpenChange={() => {}} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' }), {
      target: { value: 'texto qualquer' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'organize.cta' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'organize.cta' })).not.toBeDisabled())
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})
