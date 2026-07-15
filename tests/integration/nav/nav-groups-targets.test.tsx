import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockOpenChatSheet = vi.hoisted(() => vi.fn())
const mockCloseChatSheet = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/painel'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('@/components/features/chat/ChatSheet', () => ({
  ChatSheet: () => null,
  openChatSheet: mockOpenChatSheet,
  closeChatSheet: mockCloseChatSheet,
}))
vi.mock('@/components/features/content/GenerateSheet', () => ({ GenerateSheet: () => null }))
vi.mock('@/components/features/auth/LogoutButton', () => ({ LogoutButton: () => null }))
vi.mock('@/components/ui/Logo', () => ({ Logo: () => <div data-testid="logo" /> }))
vi.mock('@/components/ui/ThemeToggle', () => ({ ThemeToggle: () => null }))

import { AppShellClient } from '@/components/layout/AppShellClient'

describe('AppShellClient — alvos da navegação em grupos (US6)', () => {
  it('"Perfil" aponta para /espelho', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    const link = screen.getByText('appNav.perfil').closest('a')
    expect(link).toHaveAttribute('href', '/espelho')
  })

  it('"Trajetória" aponta para /espelho com o parâmetro que pré-seleciona a vista', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    const link = screen.getByText('appNav.trajetoria').closest('a')
    expect(link).toHaveAttribute('href', '/espelho?vista=trajetoria')
  })

  it('"Gerar conteúdo" abre /presenca?hub=mostrar direto', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    const link = screen.getByText('appNav.gerarConteudo').closest('a')
    expect(link).toHaveAttribute('href', '/presenca?hub=mostrar')
  })

  it('"Me preparar" abre /presenca?hub=preparar direto', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    const link = screen.getByText('appNav.mePreparar').closest('a')
    expect(link).toHaveAttribute('href', '/presenca?hub=preparar')
  })

  it('"Perguntar" chama openChatSheet() e não é um link de navegação', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    const perguntar = screen.getByText('appNav.perguntar').closest('button')
    expect(perguntar).not.toBeNull()
    expect(screen.getByText('appNav.perguntar').closest('a')).toBeNull()

    fireEvent.click(perguntar!)
    expect(mockOpenChatSheet).toHaveBeenCalled()
  })

  it('"Registrar" isolado no topo é uma ação (não navega) que abre o Drawer', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    const registrar = screen.getByText('appNav.registrar').closest('button')
    expect(registrar).not.toBeNull()

    fireEvent.click(registrar!)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
