import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BatchSummary } from '../BatchSummary'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'batch.summary') return `Criei ${values?.n ?? 0} entradas`
    if (key === 'batch.undo') return 'Desfazer'
    if (key === 'batch.undone') return 'Entradas removidas.'
    if (key === 'batch.undoAriaLabel') return `Desfazer ${values?.n ?? 0} entradas`
    if (key === 'batch.viewHistory') return 'Ver no histórico →'
    return key
  },
}))

describe('BatchSummary', () => {
  const mockOnUndone = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('displays the count of created entries', () => {
    render(<BatchSummary ids={['id1', 'id2', 'id3']} onUndone={mockOnUndone} />)
    expect(screen.getByText(/criei 3 entradas/i)).toBeInTheDocument()
  })

  it('shows an undo button', () => {
    render(<BatchSummary ids={['id1']} onUndone={mockOnUndone} />)
    expect(screen.getByRole('button', { name: /desfazer/i })).toBeInTheDocument()
  })

  it('calls DELETE /api/entries/batch with the ids on undo', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    render(<BatchSummary ids={['id1', 'id2']} onUndone={mockOnUndone} />)
    fireEvent.click(screen.getByRole('button', { name: /desfazer/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/entries/batch',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  it('calls onUndone callback after successful undo', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    render(<BatchSummary ids={['id1']} onUndone={mockOnUndone} />)
    fireEvent.click(screen.getByRole('button', { name: /desfazer/i }))

    await waitFor(() => {
      expect(mockOnUndone).toHaveBeenCalled()
    })
  })

  it('shows confirmation message after undo', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    render(<BatchSummary ids={['id1']} onUndone={mockOnUndone} />)
    fireEvent.click(screen.getByRole('button', { name: /desfazer/i }))

    await waitFor(() => {
      expect(screen.getByText(/entradas removidas/i)).toBeInTheDocument()
    })
  })
})
