import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

// T045 (US5, FR-012): clicar no gatilho de Registro do Painel abre o Drawer. O gatilho dispara um
// evento global (`borogodo:open-drawer`) que o AppShellClient escuta — mesmo mecanismo do item
// "Registrar" isolado no topo da sidebar (US6). Testamos o par gatilho+shell, já que o Drawer em
// si é montado pelo AppShellClient, não pela página.

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
import { RegistroTrigger } from '@/components/features/painel/RegistroTrigger'

describe('RegistroTrigger — abre o Drawer (US5)', () => {
  it('clicar (focar) no gatilho de Registro abre o Drawer', () => {
    render(
      <AppShellClient userName="Ana">
        <RegistroTrigger />
      </AppShellClient>
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    const trigger = screen.getByLabelText('ariaLabel')
    fireEvent.click(trigger)
    fireEvent.focus(trigger)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('colar texto direto no gatilho abre o Drawer com o conteúdo preenchido (FR-012a)', () => {
    render(
      <AppShellClient userName="Ana">
        <RegistroTrigger />
      </AppShellClient>
    )

    const trigger = screen.getByLabelText('ariaLabel') as HTMLInputElement
    fireEvent.paste(trigger, {
      clipboardData: { getData: () => 'Resolvi um incidente em produção' },
    })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Resolvi um incidente em produção')).toBeInTheDocument()
  })
})
