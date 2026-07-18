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
import type { EditEntryDetail } from '@/components/features/painel/registroTriggerEvents'

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
})

const EDIT_ENTRY: EditEntryDetail = {
  id: 'entry-1',
  rawText: 'Texto de uma fonte já salva, sendo editada',
  manualFields: { metric: '', impact: '', company: '', entryDate: '' },
}

// O Drawer permanece montado entre aberturas (mesmo componente reusado pelo Registrar e pelo
// Editar) — reflete o AppShellClient real, onde a mesma instância atende as duas entradas.
function DrawerHost() {
  const [open, setOpen] = useState(true)
  const [editEntry, setEditEntry] = useState<EditEntryDetail | undefined>(EDIT_ENTRY)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setEditEntry(undefined)
          setOpen(true)
        }}
      >
        registrar de novo
      </button>
      <Drawer open={open} onOpenChange={setOpen} editEntry={editEntry} />
    </>
  )
}

describe('Drawer — fechar uma edição não vaza pro próximo Registrar em branco', () => {
  it('texto da edição não reaparece quando o drawer reabre pra um registro novo, sem editEntry', () => {
    render(<DrawerHost />)

    expect(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' })).toHaveValue(EDIT_ENTRY.rawText)

    // Fecha via toque fora, sem salvar — igual ao cenário real (X ou clique fora).
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'registrar de novo' }))

    expect(screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' })).toHaveValue('')
  })
})
