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

describe('Drawer — texto longo colado é salvo verbatim (US1)', () => {
  it('envia o texto colado inteiro, sem truncar no cliente', async () => {
    const longText = `título da transcrição\n${'trecho da reunião inteira. '.repeat(300)}`.trimEnd()
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'entry-2', title: 'título da transcrição' }))

    render(<Drawer open onOpenChange={() => {}} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: longText } })
    fireEvent.click(screen.getByRole('button', { name: 'drawer.submitButton' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    const [, options] = mockFetch.mock.calls[0]
    const parsedBody = JSON.parse(options.body as string)
    expect(parsedBody.rawText).toBe(longText)
    expect(parsedBody.rawText.length).toBeGreaterThan(2000)
  })
})
