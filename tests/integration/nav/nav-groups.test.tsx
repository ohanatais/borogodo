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

describe('AppShellClient — sidebar desktop em grupos (US6)', () => {
  it('renderiza Painel e Registrar isolados no topo, fora de qualquer grupo', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    const sidebar = screen.getByRole('navigation', { name: 'Navegação principal' })

    expect(within(sidebar).getByText('appNav.painel')).toBeInTheDocument()
    expect(within(sidebar).getByText('appNav.registrar')).toBeInTheDocument()
  })

  it('renderiza o grupo "Meu espelho" com Perfil, Trajetória e Registros', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    const sidebar = screen.getByRole('navigation', { name: 'Navegação principal' })

    expect(within(sidebar).getByText('appNav.groups.meuEspelho')).toBeInTheDocument()
    expect(within(sidebar).getByText('appNav.perfil')).toBeInTheDocument()
    expect(within(sidebar).getByText('appNav.trajetoria')).toBeInTheDocument()
    expect(within(sidebar).getByText('appNav.registros')).toBeInTheDocument()
  })

  it('renderiza o grupo "Usar" com Gerar conteúdo, Me preparar e Perguntar', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    const sidebar = screen.getByRole('navigation', { name: 'Navegação principal' })

    expect(within(sidebar).getByText('appNav.groups.usar')).toBeInTheDocument()
    expect(within(sidebar).getByText('appNav.gerarConteudo')).toBeInTheDocument()
    expect(within(sidebar).getByText('appNav.mePreparar')).toBeInTheDocument()
    expect(within(sidebar).getByText('appNav.perguntar')).toBeInTheDocument()
  })

  it('não sobra nenhum toggle Segmented "Registrar | Perguntar" na sidebar desktop', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)

    // O grupo do toggle antigo tinha aria-label "Modo da barra" (Segmented). Não deve mais existir.
    expect(screen.queryByRole('group', { name: 'Modo da barra' })).not.toBeInTheDocument()
  })
})
