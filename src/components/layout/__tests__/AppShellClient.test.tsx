import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/painel'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: () => ({ refresh: vi.fn() }),
}))

// Componentes pesados de chat/conteúdo/drawer — fora do escopo deste teste de navegação.
vi.mock('@/components/features/capture/Drawer', () => ({ Drawer: () => null }))
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
  it('mostra destinos diretos e grupos contextuais no mobile', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    const links = hrefs()
    expect(links).toContain('/painel')
    expect(links).toContain('/espelho')
    expect(links).toContain('/registros')
    expect(links).toContain('/configuracoes')
    expect(screen.getByRole('link', { name: 'appNav.espelho' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'appNav.usar' })).toBeInTheDocument()
  })

  it('não mostra destinos antigos e mantém Autoavaliação dentro de Usar', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    const links = hrefs()
    expect(links).not.toContain('/historico')
    expect(links).not.toContain('/presenca')
    expect(links).toContain('/autoavaliacao')
  })
})
