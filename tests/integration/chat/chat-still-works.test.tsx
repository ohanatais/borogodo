import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ChatSheet, openChatSheet, closeChatSheet } from '@/components/features/chat/ChatSheet'

/**
 * T074 (025, Phase 10) — regressão: o modo "Perguntar" (chat) continua funcional depois do
 * reposicionamento no menu (US6): não é mais aberto pelo toggle `Segmented` "Registrar |
 * Perguntar" (removido de `AppShellClient.tsx`), e sim pelo item "Perguntar" da navegação nova
 * (grupo "Usar"), que chama `openChatSheet()` diretamente (`action: 'open-chat'` em
 * `navModel.ts`). `ChatSheet` em si não muda de lugar nem de contrato — só quem o abre.
 */

function encodeSSE(events: Array<Record<string, unknown>>): Uint8Array {
  const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('')
  return new TextEncoder().encode(body)
}

function streamingResponse(events: Array<Record<string, unknown>>): Response {
  const bytes = encodeSSE(events)
  let sent = false
  const body = {
    getReader: () => ({
      read: async () => {
        if (sent) return { done: true, value: undefined }
        sent = true
        return { done: false, value: bytes }
      },
      releaseLock: () => {},
    }),
  }
  return { ok: true, body } as unknown as Response
}

describe('Regressão — modo Perguntar (chat) após reposicionamento no menu (T074)', () => {
  beforeEach(() => {
    // jsdom não implementa `Element.scrollTo` — o ChatSheet chama pra rolar a lista de mensagens.
    Element.prototype.scrollTo = vi.fn()

    global.fetch = vi.fn((url: RequestInfo | URL) => {
      const href = typeof url === 'string' ? url : url.toString()
      if (href === '/api/chat/starters') {
        return Promise.resolve({ json: async () => ({ starters: [] }) } as Response)
      }
      if (href === '/api/chat') {
        return Promise.resolve(
          streamingResponse([
            { type: 'delta', text: 'Você fechou 3 entregas este trimestre.' },
            { type: 'done', citations: [], suggestions: [] },
          ])
        )
      }
      return Promise.reject(new Error(`unexpected fetch: ${href}`))
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
    closeChatSheet()
  })

  it('abre via openChatSheet() (chamado pelo item "Perguntar" da navegação, não mais pelo toggle antigo)', async () => {
    render(<ChatSheet />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    act(() => {
      openChatSheet()
    })

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Perguntar sobre minha carreira')).toBeInTheDocument()
  })

  it('envia uma pergunta e recebe a resposta em streaming, como antes do reposicionamento', async () => {
    render(<ChatSheet />)

    act(() => {
      openChatSheet()
    })
    await screen.findByRole('dialog')

    const textarea = screen.getByLabelText('Campo de pergunta sobre sua carreira')
    fireEvent.change(textarea, { target: { value: 'O que eu entreguei este trimestre?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByText('O que eu entreguei este trimestre?')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Você fechou 3 entregas este trimestre.')).toBeInTheDocument()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('fecha via closeChatSheet() (mesma API usada pelo botão de fechar do sheet)', async () => {
    render(<ChatSheet />)

    act(() => {
      openChatSheet()
    })
    await screen.findByRole('dialog')

    act(() => {
      closeChatSheet()
    })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('prefill vindo de outro fluxo ainda auto-envia uma pergunta', async () => {
    render(<ChatSheet />)

    act(() => {
      openChatSheet({ prefillMessage: 'Fiz uma entrega importante' })
    })

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Perguntar sobre minha carreira')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Fiz uma entrega importante')).toBeInTheDocument()
    })
  })
})
