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

describe('SavedPanel aparece após salvar (US3)', () => {
  it('mostra confirmação e título pré-preenchido editável', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'entry-3', title: 'resolvi um bug hoje' }))

    render(<Drawer open onOpenChange={() => {}} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' }), {
      target: { value: 'resolvi um bug hoje' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'drawer.submitButton' }))

    await waitFor(() => {
      expect(screen.getByText('savedPanel.confirmation')).toBeInTheDocument()
    })

    const titleInput = screen.getByRole('textbox', { name: 'savedPanel.titleAriaLabel' }) as HTMLInputElement
    expect(titleInput.value).toBe('resolvi um bug hoje')

    // O corpo de composição (textarea de escrita) não deve mais estar visível.
    expect(screen.queryByRole('textbox', { name: 'drawer.textareaAriaLabel' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'savedPanel.doneButton' })).toBeInTheDocument()
  })
})
