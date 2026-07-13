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

describe('Drawer — preencher e salvar campos manuais (US4)', () => {
  it('envia manualFields com exatamente o que foi digitado', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'entry-42', title: 'fechei a negociação' }))

    render(<Drawer open onOpenChange={() => {}} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' }), {
      target: { value: 'fechei a negociação' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'detailsFields.toggleLabel' }))

    fireEvent.change(screen.getByLabelText('detailsFields.metricLabel'), { target: { value: 'aceite em 2 ciclos' } })
    fireEvent.change(screen.getByLabelText('detailsFields.impactLabel'), { target: { value: 'reduziu retrabalho do time' } })
    fireEvent.change(screen.getByLabelText('detailsFields.tagsLabel'), { target: { value: 'negociação, processo' } })
    fireEvent.change(screen.getByLabelText('detailsFields.companyLabel'), { target: { value: 'Acme' } })
    fireEvent.change(screen.getByLabelText('detailsFields.dateLabel'), { target: { value: '2026-07-10' } })

    fireEvent.click(screen.getByRole('button', { name: 'drawer.submitButton' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    const [, options] = mockFetch.mock.calls[0]
    const parsedBody = JSON.parse(options.body as string)
    expect(parsedBody).toEqual({
      kind: 'deposito',
      rawText: 'fechei a negociação',
      manualFields: {
        metric: 'aceite em 2 ciclos',
        impact: 'reduziu retrabalho do time',
        tags: ['negociação', 'processo'],
        company: 'Acme',
        entryDate: '2026-07-10',
      },
    })
  })
})
