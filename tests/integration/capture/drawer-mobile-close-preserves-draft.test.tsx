import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.stubGlobal('fetch', mockFetch)

import { Drawer } from '@/components/features/capture/Drawer'

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
})

// O Drawer permanece montado (`open` só controla se renderiza o conteúdo) — igual ao AppShellClient
// real, que nunca desmonta o Drawer/ChatSheet/GenerateSheet. Isso é o que garante que o rascunho da
// sessão sobrevive ao fechar sem salvar.
function DrawerHost() {
  const [open, setOpen] = useState(true)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        reabrir
      </button>
      <Drawer open={open} onOpenChange={setOpen} />
    </>
  )
}

describe('Drawer mobile — fechar sem salvar preserva o rascunho da sessão (US7)', () => {
  it('texto digitado continua lá ao reabrir na mesma sessão, sem persistir como registro', () => {
    render(<DrawerHost />)

    fireEvent.change(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' }), {
      target: { value: 'rascunho que não terminei' },
    })

    // Fecha via toque fora (o backdrop dispara onOpenChange(false) sem chamar draft.reset()).
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'reabrir' }))

    expect(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' })).toHaveValue(
      'rascunho que não terminei'
    )
  })
})
