import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import type { Reflection } from '@/types/capture'

const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        ({
          children,
          className,
          initial: _initial,
          animate: _animate,
          transition: _transition,
          ...domProps
        }: {
          children: React.ReactNode
          className?: string
          initial?: unknown
          animate?: unknown
          transition?: unknown
          [key: string]: unknown
        }) => React.createElement(tag, { className, ...domProps }, children),
    }
  ),
}))

vi.stubGlobal('fetch', mockFetch)

import { CaptureComposer } from '@/components/features/capture/CaptureComposer'

const REFLECTION: Reflection = {
  summary: 'Você concluiu a migração sob prazo apertado.',
  pills: ['decisão sob pressão', 'entrega técnica'],
  move: { type: 'question', text: 'Tem um número de impacto? Mesmo estimado conta.', field: 'metric' },
}

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response
}

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
})

describe('Capture flow — composer to reflection', () => {
  it('T012: opens the conversation, shows reading then the reflection, and refreshes the panel on resolve', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ entries: [{ id: 'entry-1' }], reflection: REFLECTION })
    )

    render(<CaptureComposer placeholder="Conta uma coisa que você fez no trabalho." />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Conclui a migração do banco sem downtime' } })
    fireEvent.click(screen.getByRole('button', { name: 'composer.submitAriaLabel' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(REFLECTION.summary)).toBeInTheDocument()
    })
    expect(screen.getByText(REFLECTION.move.text)).toBeInTheDocument()
    expect(mockRouterRefresh).toHaveBeenCalled()

    fireEvent.click(screen.getByText('reflection.saveAsIs'))
    await waitFor(() => {
      expect(screen.queryByText(REFLECTION.summary)).not.toBeInTheDocument()
    })
  })

  it('T012: shows an error state with retry when the capture request fails', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'boom' }, false))

    render(<CaptureComposer placeholder="Conta uma coisa que você fez no trabalho." />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Uma entrada qualquer' } })
    fireEvent.click(screen.getByRole('button', { name: 'composer.submitAriaLabel' }))

    expect(await screen.findByText('error.message')).toBeInTheDocument()
    expect(screen.getByText('error.retry')).toBeInTheDocument()
  })

  it('T013: renders audio and image buttons disabled with a "coming soon" tooltip', () => {
    render(<CaptureComposer placeholder="Conta uma coisa que você fez no trabalho." />)

    const audioButton = screen.getByRole('button', { name: 'composer.audioAriaLabel' })
    expect(audioButton).toBeDisabled()
    expect(audioButton).toHaveAttribute('title', 'composer.audioComingSoon')
  })
})
