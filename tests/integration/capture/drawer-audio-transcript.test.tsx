import { render, screen, fireEvent } from '@testing-library/react'
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

vi.mock('@/components/features/capture/AudioButton', () => ({
  AudioButton: ({ onTranscript }: { onTranscript?: (text: string) => void }) => (
    <button type="button" onClick={() => onTranscript?.('resolvi um bug em produção')}>
      audio.mockButton
    </button>
  ),
}))

vi.stubGlobal('fetch', mockFetch)

import { Drawer } from '@/components/features/capture/Drawer'

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
  mockOpenChatSheet.mockReset()
})

describe('Drawer — transcrição de voz (FR-018)', () => {
  it('insere o texto transcrito no bloco-de-notas, sem virar anexo', () => {
    render(<Drawer open onOpenChange={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'audio.mockButton' }))

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('resolvi um bug em produção')
    expect(screen.queryByText(/anexo/i)).not.toBeInTheDocument()
  })

  it('acrescenta a transcrição ao texto já digitado, numa nova linha', () => {
    render(<Drawer open onOpenChange={() => {}} />)

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'já escrevi isso' } })
    fireEvent.click(screen.getByRole('button', { name: 'audio.mockButton' }))

    expect(textarea.value).toBe('já escrevi isso\nresolvi um bug em produção')
  })
})
