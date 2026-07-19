import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.stubGlobal('fetch', mockFetch)

import { Drawer } from '@/components/features/capture/Drawer'
import type { EditEntryDetail } from '@/components/features/painel/registroTriggerEvents'

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
})

const EDIT_ENTRY: EditEntryDetail = {
  id: 'entry-2',
  rawText: 'Texto de outra fonte, aberta em modo edição depois de um registro salvo',
  manualFields: { metric: '', impact: '', company: '', entryDate: '' },
}

// O Drawer permanece montado entre aberturas (AppShellClient real) — este host reproduz o
// fluxo: registrar algo novo (vê a tela de sucesso), fechar sem clicar em "Concluir", e depois
// abrir o Drawer de novo em modo edição de OUTRA fonte.
function DrawerHost() {
  const [open, setOpen] = useState(true)
  const [editEntry, setEditEntry] = useState<EditEntryDetail | undefined>(undefined)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setEditEntry(EDIT_ENTRY)
          setOpen(true)
        }}
      >
        editar outra fonte
      </button>
      <Drawer open={open} onOpenChange={setOpen} editEntry={editEntry} />
    </>
  )
}

describe('Drawer — tela de sucesso presa não vaza pra próxima abertura (bug real de produção)', () => {
  it('fechar a tela de sucesso sem clicar em "Concluir" e reabrir pra editar outra fonte mostra o formulário de edição, não a tela de sucesso antiga', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'entry-1', title: 'Registro recém-salvo' }),
    })

    render(<DrawerHost />)

    fireEvent.change(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' }), {
      target: { value: 'Primeiro registro, ainda sem editar nada' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'drawer.submitButton' }))

    await waitFor(() => expect(screen.getByLabelText('savedPanel.titleAriaLabel')).toBeInTheDocument())

    // Fecha clicando fora — NUNCA clicou em "Concluir" (savedPanel.doneButton).
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'editar outra fonte' }))

    expect(screen.queryByLabelText('savedPanel.titleAriaLabel')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' })).toHaveValue(EDIT_ENTRY.rawText)
  })
})
