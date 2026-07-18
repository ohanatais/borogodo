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

const MULTI_HIGHLIGHT_ENTRY: EditEntryDetail = {
  id: 'entry-multi',
  rawText: 'Transcrição de uma entrevista com vários resultados distintos',
  manualFields: { metric: '', impact: '', company: '', entryDate: '' },
  isMultiHighlight: true,
}

const SINGLE_HIGHLIGHT_ENTRY: EditEntryDetail = {
  id: 'entry-single',
  rawText: 'Um registro com um destaque só',
  manualFields: { metric: '10%', impact: 'Reduziu retrabalho', company: '', entryDate: '' },
  isMultiHighlight: false,
}

// Reflete o fluxo real (AppShellClient): editEntry começa undefined e só passa a existir quando
// "Editar" é clicado, com o Drawer já montado — é essa TRANSIÇÃO que a seção "+ adicionar
// detalhes" observa pra se abrir sozinha (ver `DetailsFields`, `forceOpen`).
function DrawerHost({ entry }: { entry: EditEntryDetail }) {
  const [editEntry, setEditEntry] = useState<EditEntryDetail | undefined>(undefined)
  return (
    <>
      <button type="button" onClick={() => setEditEntry(entry)}>
        editar
      </button>
      <Drawer open onOpenChange={() => {}} editEntry={editEntry} />
    </>
  )
}

describe('Drawer — editar fonte com 2+ destaques esconde Métrica/Impacto/Organizar (revisão pós-implementação, 026)', () => {
  it('isMultiHighlight: true esconde o botão "Organizar" e os campos Métrica/Impacto, mostrando uma explicação no lugar', () => {
    render(<DrawerHost entry={MULTI_HIGHLIGHT_ENTRY} />)
    fireEvent.click(screen.getByRole('button', { name: 'editar' }))

    expect(screen.queryByRole('button', { name: 'organize.cta' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('detailsFields.metricLabel')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('detailsFields.impactLabel')).not.toBeInTheDocument()
    expect(screen.getByText('detailsFields.multiHighlightHint')).toBeInTheDocument()

    // Tags/empresa/data continuam editáveis — só métrica/impacto/organizar somem.
    expect(screen.getByLabelText('detailsFields.tagsLabel')).toBeInTheDocument()
    expect(screen.getByLabelText('detailsFields.dateLabel')).toBeInTheDocument()
  })

  it('isMultiHighlight: false (ou ausente) mantém "Organizar" e Métrica/Impacto normalmente', () => {
    render(<DrawerHost entry={SINGLE_HIGHLIGHT_ENTRY} />)
    fireEvent.click(screen.getByRole('button', { name: 'editar' }))

    expect(screen.getByRole('button', { name: 'organize.cta' })).toBeInTheDocument()
    expect(screen.getByLabelText('detailsFields.metricLabel')).toHaveValue('10%')
    expect(screen.getByLabelText('detailsFields.impactLabel')).toHaveValue('Reduziu retrabalho')
    expect(screen.queryByText('detailsFields.multiHighlightHint')).not.toBeInTheDocument()
  })
})
