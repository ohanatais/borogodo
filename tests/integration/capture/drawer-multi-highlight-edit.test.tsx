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
import { ENTRY_HIGHLIGHTS_UPDATED_EVENT } from '@/components/features/painel/registroTriggerEvents'

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
})

const MULTI_HIGHLIGHT_ENTRY: EditEntryDetail = {
  id: 'entry-multi',
  rawText: 'Transcrição de uma entrevista com vários resultados distintos',
  manualFields: { metric: '', impact: '', company: '', entryDate: '' },
  isMultiHighlight: true,
  highlights: [
    { id: 'h1', title: 'Destaque 1', metric: '20.000 vidas', impact: null, tags: [] },
    { id: 'h2', title: 'Destaque 2', metric: null, impact: null, tags: [] },
  ],
}

const SINGLE_HIGHLIGHT_ENTRY: EditEntryDetail = {
  id: 'entry-single',
  rawText: 'Um registro com um destaque só',
  manualFields: { metric: '10%', impact: 'Reduziu retrabalho', company: '', entryDate: '' },
  isMultiHighlight: false,
  highlights: [{ id: 'h1', title: 'Único destaque', metric: '10%', impact: 'Reduziu retrabalho', tags: [] }],
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

describe('Drawer — editar fonte com 2+ destaques mostra a lista + "Organizar de novo" (revisão manual, 026)', () => {
  it('esconde o "Organizar" de pré-visualização e Métrica/Impacto, mostrando a lista de destaques + "Organizar de novo" no lugar', () => {
    render(<DrawerHost entry={MULTI_HIGHLIGHT_ENTRY} />)
    fireEvent.click(screen.getByRole('button', { name: 'editar' }))

    expect(screen.queryByRole('button', { name: 'organize.cta' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('detailsFields.metricLabel')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('detailsFields.impactLabel')).not.toBeInTheDocument()
    expect(screen.getByText('detailsFields.multiHighlightHint')).toBeInTheDocument()

    expect(screen.getByText('Destaque 1')).toBeInTheDocument()
    expect(screen.getByText('20.000 vidas')).toBeInTheDocument()
    expect(screen.getByText('Destaque 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'organize.ctaAgain' })).toBeInTheDocument()

    // Tags/empresa/data continuam editáveis — só métrica/impacto/organizar (de pré-visualização) somem.
    expect(screen.getByLabelText('detailsFields.tagsLabel')).toBeInTheDocument()
    expect(screen.getByLabelText('detailsFields.dateLabel')).toBeInTheDocument()
  })

  it('clicar em "Organizar de novo" chama o mesmo endpoint do card, substitui a lista e notifica o card via evento', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'organized',
        highlights: [
          { id: 'h3', title: 'Destaque recalculado', metric: null, impact: null, tags: [] },
          { id: 'h4', title: 'Segundo destaque recalculado', metric: null, impact: null, tags: [] },
        ],
      }),
    })
    const eventListener = vi.fn()
    window.addEventListener(ENTRY_HIGHLIGHTS_UPDATED_EVENT, eventListener)

    render(<DrawerHost entry={MULTI_HIGHLIGHT_ENTRY} />)
    fireEvent.click(screen.getByRole('button', { name: 'editar' }))
    fireEvent.click(screen.getByRole('button', { name: 'organize.ctaAgain' }))

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith('/api/entries/entry-multi/organize', { method: 'POST' })
    )
    await waitFor(() => expect(screen.getByText('Destaque recalculado')).toBeInTheDocument())
    expect(screen.queryByText('Destaque 1')).not.toBeInTheDocument()
    expect(eventListener).toHaveBeenCalledTimes(1)

    window.removeEventListener(ENTRY_HIGHLIGHTS_UPDATED_EVENT, eventListener)
  })

  it('fonte com 1 destaque só mantém "Organizar" de pré-visualização e Métrica/Impacto normalmente', () => {
    render(<DrawerHost entry={SINGLE_HIGHLIGHT_ENTRY} />)
    fireEvent.click(screen.getByRole('button', { name: 'editar' }))

    expect(screen.getByRole('button', { name: 'organize.cta' })).toBeInTheDocument()
    expect(screen.getByLabelText('detailsFields.metricLabel')).toHaveValue('10%')
    expect(screen.getByLabelText('detailsFields.impactLabel')).toHaveValue('Reduziu retrabalho')
    expect(screen.queryByText('detailsFields.multiHighlightHint')).not.toBeInTheDocument()
  })
})
