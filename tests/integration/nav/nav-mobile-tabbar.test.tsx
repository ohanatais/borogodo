import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/painel'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('@/components/features/chat/ChatSheet', () => ({
  ChatSheet: () => null,
  openChatSheet: vi.fn(),
  closeChatSheet: vi.fn(),
}))
vi.mock('@/components/features/content/GenerateSheet', () => ({ GenerateSheet: () => null }))
vi.mock('@/components/features/auth/LogoutButton', () => ({ LogoutButton: () => null }))
vi.mock('@/components/ui/Logo', () => ({ Logo: () => <div data-testid="logo" /> }))
vi.mock('@/components/ui/ThemeToggle', () => ({ ThemeToggle: () => null }))

import { AppShellClient } from '@/components/layout/AppShellClient'

describe('AppShellClient — tab bar mobile continua com 4 destinos (US6, FR-025)', () => {
  it('mantém exatamente 4 abas: Painel, Espelho, Registros, Usar — "Espelho" único, sem Perfil/Trajetória separados', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)

    const mobileNav = screen.getByRole('navigation', { name: 'Navegação' })
    const links = within(mobileNav).getAllByRole('link')

    expect(links).toHaveLength(4)
    expect(within(mobileNav).getByText('appNav.painel')).toBeInTheDocument()
    expect(within(mobileNav).getByText('appNav.espelho')).toBeInTheDocument()
    expect(within(mobileNav).getByText('appNav.registros')).toBeInTheDocument()
    expect(within(mobileNav).getByText('appNav.usar')).toBeInTheDocument()

    expect(within(mobileNav).queryByText('appNav.perfil')).not.toBeInTheDocument()
    expect(within(mobileNav).queryByText('appNav.trajetoria')).not.toBeInTheDocument()
  })

  it('mantém o FAB central que abre o Drawer', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    expect(screen.getByRole('button', { name: 'drawer.title' })).toBeInTheDocument()
  })
})
