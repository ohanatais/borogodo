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

const ENTRY_A: EditEntryDetail = {
  id: 'entry-a',
  rawText: 'Texto do registro A',
  manualFields: { metric: '10%', impact: '', company: '', entryDate: '' },
  isMultiHighlight: false,
}

const ENTRY_B: EditEntryDetail = {
  id: 'entry-b',
  rawText: 'Texto do registro B',
  manualFields: { metric: '20%', impact: '', company: '', entryDate: '' },
  isMultiHighlight: false,
}

function DrawerHost() {
  const [editEntry, setEditEntry] = useState<EditEntryDetail | undefined>(undefined)
  return (
    <>
      <button type="button" onClick={() => setEditEntry(ENTRY_A)}>
        editar A
      </button>
      <button type="button" onClick={() => setEditEntry(ENTRY_B)}>
        editar B
      </button>
      <Drawer open onOpenChange={() => {}} editEntry={editEntry} />
    </>
  )
}

describe('Drawer — trocar de fonte editada reabre "+ adicionar detalhes" (bug real: 2ª edição na mesma sessão do Drawer ficava colapsada)', () => {
  it('editar A abre os detalhes; editar B (fonte diferente) na sequência também abre, mesmo já estando "true" antes', () => {
    render(<DrawerHost />)

    fireEvent.click(screen.getByRole('button', { name: 'editar A' }))
    expect(screen.getByLabelText('detailsFields.metricLabel')).toHaveValue('10%')

    // Fecha manualmente a seção — simula a pessoa recolhendo antes de trocar de registro.
    fireEvent.click(screen.getByRole('button', { name: 'detailsFields.collapseLabel' }))
    expect(screen.queryByLabelText('detailsFields.metricLabel')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'editar B' }))

    expect(screen.getByLabelText('detailsFields.metricLabel')).toHaveValue('20%')
  })
})

describe('Drawer — botão de salvar diz "Atualizar" em modo edição, "Registrar" ao criar', () => {
  it('mostra drawer.updateButton com editEntry, drawer.submitButton sem', () => {
    render(<DrawerHost />)

    expect(screen.getByRole('button', { name: 'drawer.submitButton' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'editar A' }))

    expect(screen.queryByRole('button', { name: 'drawer.submitButton' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'drawer.updateButton' })).toBeInTheDocument()
  })
})
