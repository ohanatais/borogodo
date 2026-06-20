import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BatchSummary } from '../BatchSummary'
import type { BatchEntry } from '@/types/capture'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    switch (key) {
      case 'batch.summary': return `Criei ${values?.n ?? 0} entradas`
      case 'batch.reviewHint': return 'Revise e descarte o que não quiser.'
      case 'batch.reviewHintCompany': return `${values?.company} · revise`
      case 'batch.undo': return 'Desfazer tudo'
      case 'batch.undoAriaLabel': return `Desfazer ${values?.n ?? 0} entradas`
      case 'batch.discard': return 'Descartar'
      case 'batch.discardAriaLabel': return `Descartar: ${values?.title ?? ''}`
      case 'batch.undone': return 'Entradas removidas.'
      case 'batch.viewFeed': return 'Ver registros →'
      case 'error.message': return 'Algo deu errado.'
      default: return key
    }
  },
}))

/** Empresas mistas (uma null) → não há empresa compartilhada. */
function mixedEntries(): BatchEntry[] {
  return [
    { id: 'id1', title: 'Liderei o lançamento', what_i_did: 'Coordenei o time', company: 'Acme' },
    { id: 'id2', title: null, what_i_did: 'Refatorei o checkout', company: null },
    { id: 'id3', title: 'Mentorei dois juniores', what_i_did: 'Pareei toda semana', company: 'Beta' },
  ]
}

const ok = () => new Response(JSON.stringify({ ok: true }), { status: 200 })
const fail = () => new Response(JSON.stringify({ error: 'x' }), { status: 500 })

describe('BatchSummary', () => {
  const onUndone = vi.fn()
  const onDone = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('displays the count of created entries', () => {
    render(<BatchSummary entries={mixedEntries()} onUndone={onUndone} onDone={onDone} />)
    expect(screen.getByText(/criei 3 entradas/i)).toBeInTheDocument()
  })

  it('lists each entry by title (or what_i_did fallback)', () => {
    render(<BatchSummary entries={mixedEntries()} onUndone={onUndone} onDone={onDone} />)
    expect(screen.getByText('Liderei o lançamento')).toBeInTheDocument()
    expect(screen.getByText('Refatorei o checkout')).toBeInTheDocument() // title null → fallback
    expect(screen.getByText('Mentorei dois juniores')).toBeInTheDocument()
  })

  it('shows per-entry company when companies differ', () => {
    render(<BatchSummary entries={mixedEntries()} onUndone={onUndone} onDone={onDone} />)
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('shows the shared company once in the header (not per-item) when all match', () => {
    const entries: BatchEntry[] = [
      { id: 'a', title: 'Um', what_i_did: 'x', company: 'Acme' },
      { id: 'b', title: 'Dois', what_i_did: 'y', company: 'Acme' },
    ]
    render(<BatchSummary entries={entries} onUndone={onUndone} onDone={onDone} />)
    // aparece uma única vez (no header), não uma por item
    expect(screen.getAllByText(/Acme/)).toHaveLength(1)
  })

  it('discards a single entry via DELETE /api/entries/[id] and removes it from the list', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(ok())
    render(<BatchSummary entries={mixedEntries()} onUndone={onUndone} onDone={onDone} />)

    fireEvent.click(screen.getByRole('button', { name: /descartar: refatorei o checkout/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/entries/id2', expect.objectContaining({ method: 'DELETE' }))
    })
    await waitFor(() => expect(screen.queryByText('Refatorei o checkout')).not.toBeInTheDocument())
    expect(screen.getByText('Liderei o lançamento')).toBeInTheDocument()
    expect(screen.getByText(/criei 2 entradas/i)).toBeInTheDocument()
  })

  it('rolls back the discarded entry and shows an error when the delete fails', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(fail())
    render(<BatchSummary entries={mixedEntries()} onUndone={onUndone} onDone={onDone} />)

    fireEvent.click(screen.getByRole('button', { name: /descartar: refatorei o checkout/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText('Refatorei o checkout')).toBeInTheDocument() // restaurado
    expect(screen.getByText(/criei 3 entradas/i)).toBeInTheDocument()
  })

  it('navigates to /registros and closes on "Ver registros"', async () => {
    render(<BatchSummary entries={mixedEntries()} onUndone={onUndone} onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /ver registros/i }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/registros'))
    expect(onDone).toHaveBeenCalled()
  })

  it('calls DELETE /api/entries/batch with all ids on undo-all', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(ok())
    render(<BatchSummary entries={mixedEntries()} onUndone={onUndone} onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /desfazer \d+ entradas/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/entries/batch', expect.objectContaining({ method: 'DELETE' }))
    })
    await waitFor(() => expect(onUndone).toHaveBeenCalled())
  })

  it('shows the removed message when the last entry is discarded', async () => {
    vi.mocked(global.fetch).mockResolvedValue(ok())
    render(
      <BatchSummary
        entries={[{ id: 'only', title: 'Única', what_i_did: 'fiz algo', company: null }]}
        onUndone={onUndone}
        onDone={onDone}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /descartar: única/i }))
    await waitFor(() => expect(screen.getByText(/entradas removidas/i)).toBeInTheDocument())
  })
})
