import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())
const mockOpenChatSheet = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.mock('@/components/features/chat/ChatSheet', () => ({
  openChatSheet: mockOpenChatSheet,
  closeChatSheet: vi.fn(),
}))

vi.stubGlobal('fetch', mockFetch)

import { Drawer } from '@/components/features/capture/Drawer'

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response
}

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
  mockOpenChatSheet.mockReset()
})

describe('Drawer — sempre salva (US1)', () => {
  it('salva um texto de poucas palavras, sem erro e sem abrir o ChatSheet', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'entry-1', title: 'resolvi um bug hoje' }))
    const onSaved = vi.fn()

    render(<Drawer open onOpenChange={() => {}} onSaved={onSaved} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'resolvi um bug hoje' } })
    fireEvent.click(screen.getByRole('button', { name: 'drawer.submitButton' }))

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith({ id: 'entry-1', title: 'resolvi um bug hoje' })
    })

    const [, options] = mockFetch.mock.calls[0]
    const parsedBody = JSON.parse(options.body as string)
    expect(parsedBody).toEqual({ kind: 'deposito', rawText: 'resolvi um bug hoje' })

    expect(mockOpenChatSheet).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mantém o botão desabilitado e não dispara fetch quando o texto é só espaços', async () => {
    render(<Drawer open onOpenChange={() => {}} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '   ' } })

    const submitButton = screen.getByRole('button', { name: 'drawer.submitButton' })
    expect(submitButton).toBeDisabled()

    fireEvent.click(submitButton)
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
