import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())
const mockOnOpenChange = vi.hoisted(() => vi.fn())

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
  mockOnOpenChange.mockReset()
})

describe('Fechar SavedPanel sem editar mantém o título pré-preenchido (US3)', () => {
  it('não dispara PATCH quando o título não é alterado, e fecha o drawer ao concluir', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'entry-5', title: 'título pré-preenchido' }))

    render(<Drawer open onOpenChange={mockOnOpenChange} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' }), {
      target: { value: 'título pré-preenchido' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'drawer.submitButton' }))

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'savedPanel.titleAriaLabel' })).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledTimes(1) // só a chamada de /api/capture

    fireEvent.click(screen.getByRole('button', { name: 'savedPanel.doneButton' }))

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
