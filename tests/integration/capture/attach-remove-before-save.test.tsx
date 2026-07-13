import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.stubGlobal('fetch', mockFetch)

import { Drawer } from '@/components/features/capture/Drawer'

function makeImageFile(name = 'foto.png'): File {
  return new File(['conteudo-fake'], name, { type: 'image/png' })
}

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response
}

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
})

describe('Drawer — remover anexo antes de salvar (US2)', () => {
  it('remove localmente, sem nenhuma chamada de rede para aquele anexo', async () => {
    const { container } = render(<Drawer open onOpenChange={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'attach.imageAriaLabel' }))
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [makeImageFile()] } })

    expect(screen.getByAltText('attach.imageAlt')).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'attach.removeAriaLabel' }))
    expect(screen.queryByAltText('attach.imageAlt')).not.toBeInTheDocument()

    // Salva só com texto — a única chamada de rede deve ser a de /api/capture, nunca de evidence.
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'entry-9', title: 'sem anexo' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' }), {
      target: { value: 'sem anexo' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'drawer.submitButton' }))

    await waitFor(() => {
      expect(screen.getByText('savedPanel.confirmation')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/capture')
  })
})
