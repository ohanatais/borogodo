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

describe('Editar título no SavedPanel persiste (US3)', () => {
  it('faz PATCH em /api/entries/[id] com o novo título ao sair do campo', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'entry-4', title: 'título original' }))

    render(<Drawer open onOpenChange={mockOnOpenChange} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' }), {
      target: { value: 'título original' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'drawer.submitButton' }))

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'savedPanel.titleAriaLabel' })).toBeInTheDocument()
    })

    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }))
    const titleInput = screen.getByRole('textbox', { name: 'savedPanel.titleAriaLabel' })
    fireEvent.change(titleInput, { target: { value: 'título editado pela pessoa' } })
    fireEvent.blur(titleInput)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/entries/entry-4',
        expect.objectContaining({ method: 'PATCH' })
      )
    })

    const patchCall = mockFetch.mock.calls.find(([url]) => url === '/api/entries/entry-4')
    const body = JSON.parse((patchCall?.[1] as RequestInit).body as string)
    expect(body).toEqual({ title: 'título editado pela pessoa' })

    fireEvent.click(screen.getByRole('button', { name: 'savedPanel.doneButton' }))
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
