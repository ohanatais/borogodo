import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BatchSummary } from '../BatchSummary'
import type { BatchEntry } from '@/types/capture'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'batch.summary') return `Criei ${values?.n ?? 0} entradas`
    if (key === 'batch.undo') return 'Desfazer tudo'
    if (key === 'batch.undone') return 'Entradas removidas.'
    if (key === 'batch.undoAriaLabel') return `Desfazer ${values?.n ?? 0} entradas`
    if (key === 'batch.discardAriaLabel') return `Descartar: ${values?.title ?? ''}`
    if (key === 'batch.viewHistory') return 'Ver no histórico →'
    return key
  },
}))

function makeEntries(): BatchEntry[] {
  return [
    { id: 'id1', title: 'Liderei o lançamento', what_i_did: 'Coordenei o time', company: 'Acme' },
    { id: 'id2', title: null, what_i_did: 'Refatorei o checkout', company: null },
    { id: 'id3', title: 'Mentorei dois juniores', what_i_did: 'Pareei toda semana', company: 'Acme' },
  ]
}

describe('BatchSummary', () => {
  const mockOnUndone = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('displays the count of created entries', () => {
    render(<BatchSummary entries={makeEntries()} onUndone={mockOnUndone} />)
    expect(screen.getByText(/criei 3 entradas/i)).toBeInTheDocument()
  })

  it('lists each created entry by its title (or what_i_did fallback)', () => {
    render(<BatchSummary entries={makeEntries()} onUndone={mockOnUndone} />)
    expect(screen.getByText('Liderei o lançamento')).toBeInTheDocument()
    expect(screen.getByText('Refatorei o checkout')).toBeInTheDocument() // fallback (title null)
    expect(screen.getByText('Mentorei dois juniores')).toBeInTheDocument()
  })

  it('discards a single entry via DELETE /api/entries/[id] and removes it from the list', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    render(<BatchSummary entries={makeEntries()} onUndone={mockOnUndone} />)

    fireEvent.click(screen.getByRole('button', { name: /descartar: refatorei o checkout/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/entries/id2',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
    await waitFor(() => {
      expect(screen.queryByText('Refatorei o checkout')).not.toBeInTheDocument()
    })
    // os outros permanecem
    expect(screen.getByText('Liderei o lançamento')).toBeInTheDocument()
    expect(screen.getByText(/criei 2 entradas/i)).toBeInTheDocument()
  })

  it('shows an undo-all button', () => {
    render(<BatchSummary entries={makeEntries()} onUndone={mockOnUndone} />)
    expect(screen.getByRole('button', { name: /desfazer \d+ entradas/i })).toBeInTheDocument()
  })

  it('calls DELETE /api/entries/batch with all ids on undo-all', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    render(<BatchSummary entries={makeEntries()} onUndone={mockOnUndone} />)
    fireEvent.click(screen.getByRole('button', { name: /desfazer \d+ entradas/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/entries/batch',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  it('calls onUndone after a successful undo-all', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    render(<BatchSummary entries={makeEntries()} onUndone={mockOnUndone} />)
    fireEvent.click(screen.getByRole('button', { name: /desfazer \d+ entradas/i }))

    await waitFor(() => {
      expect(mockOnUndone).toHaveBeenCalled()
    })
  })

  it('shows the removed message when every entry is discarded', async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    render(
      <BatchSummary
        entries={[{ id: 'only', title: 'Única', what_i_did: 'fiz algo', company: null }]}
        onUndone={mockOnUndone}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /descartar: única/i }))

    await waitFor(() => {
      expect(screen.getByText(/entradas removidas/i)).toBeInTheDocument()
    })
  })
})
