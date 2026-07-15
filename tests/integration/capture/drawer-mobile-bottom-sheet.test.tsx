import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockRouterRefresh = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/painel'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

// Componentes pesados fora do escopo deste teste (só o FAB → Drawer bottom sheet importa aqui).
vi.mock('@/components/features/chat/ChatSheet', () => ({
  ChatSheet: () => null,
  openChatSheet: vi.fn(),
  closeChatSheet: vi.fn(),
}))
vi.mock('@/components/features/content/GenerateSheet', () => ({ GenerateSheet: () => null }))
vi.mock('@/components/features/auth/LogoutButton', () => ({ LogoutButton: () => null }))
vi.mock('@/components/ui/Logo', () => ({ Logo: () => <div data-testid="logo" /> }))

import { AppShellClient } from '@/components/layout/AppShellClient'

describe('AppShellClient — FAB mobile abre o Drawer como bottom sheet (US7)', () => {
  it('tocar no FAB abre o Drawer com a alça de arrastar mobile', () => {
    render(<AppShellClient userName="Ana">conteúdo</AppShellClient>)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'drawer.title' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByTestId('drawer-mobile-handle')).toBeInTheDocument()
  })
})
