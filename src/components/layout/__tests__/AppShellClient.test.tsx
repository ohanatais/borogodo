import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/painel'),
}))

// Componentes pesados de captura/chat/conteúdo — fora do escopo deste teste de navegação.
vi.mock('@/components/features/capture/CaptureInput', () => ({ CaptureInput: () => null }))
vi.mock('@/components/features/capture/FileButton', () => ({ FileButton: () => null }))
vi.mock('@/components/features/capture/AudioButton', () => ({ AudioButton: () => null }))
vi.mock('@/components/features/capture/CaptureConversation', () => ({ CaptureConversation: () => null }))
vi.mock('@/components/features/chat/ChatSheet', () => ({
  ChatSheet: () => null,
  openChatSheet: vi.fn(),
  closeChatSheet: vi.fn(),
}))
vi.mock('@/components/features/content/GenerateSheet', () => ({ GenerateSheet: () => null }))
vi.mock('@/components/features/auth/LogoutButton', () => ({ LogoutButton: () => null }))
vi.mock('@/components/ui/Logo', () => ({ Logo: () => <div data-testid="logo" /> }))

import { AppShellClient } from '../AppShellClient'

function hrefs(): string[] {
  return Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href') || '')
}

describe('AppShellClient — menu de 4 destinos', () => {
  it('mostra os 4 destinos de topo + Configurações', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    const links = hrefs()
    expect(links).toContain('/painel')
    expect(links).toContain('/espelho')
    expect(links).toContain('/registros')
    expect(links).toContain('/usar')
    expect(links).toContain('/configuracoes')
  })

  it('NÃO mostra Linha do Tempo, Repertório nem Autoavaliação no topo', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    const links = hrefs()
    expect(links).not.toContain('/historico')
    expect(links).not.toContain('/presenca')
    expect(links).not.toContain('/autoavaliacao')
  })
})
