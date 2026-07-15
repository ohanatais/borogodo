import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HighlightCard } from '../HighlightCard'
import type { EntryHighlight } from '@/types/entry'

const BASE_HIGHLIGHT: EntryHighlight = {
  id: 'highlight-1',
  entry_id: 'entry-1',
  user_id: 'user-1',
  title: 'Redução de 50% no tempo de investigação de bug crítico',
  metric: '50%',
  impact: 'Menos tempo parado no time',
  tags: ['devops'],
  position: 0,
  created_at: '2026-07-10T12:00:00.000Z',
  updated_at: '2026-07-10T12:00:00.000Z',
}

describe('HighlightCard (US4, feature 026)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('FR-017 — aberto por padrão quando é o único destaque (defaultOpen=true)', () => {
    render(
      <HighlightCard entryId="entry-1" highlight={BASE_HIGHLIGHT} defaultOpen onUpdate={vi.fn()} onDelete={vi.fn()} />
    )

    expect(screen.getByText('Menos tempo parado no time')).toBeInTheDocument()
  })

  it('FR-017 — colapsado por padrão quando defaultOpen=false, mostrando só título/métrica', () => {
    render(
      <HighlightCard entryId="entry-1" highlight={BASE_HIGHLIGHT} defaultOpen={false} onUpdate={vi.fn()} onDelete={vi.fn()} />
    )

    expect(screen.getByText(BASE_HIGHLIGHT.title as string)).toBeInTheDocument()
    expect(screen.queryByText('Menos tempo parado no time')).not.toBeInTheDocument()
  })

  it('FR-018 — não exibe métrica quando ausente, e não trata isso como erro', () => {
    const noMetric: EntryHighlight = { ...BASE_HIGHLIGHT, metric: null, title: 'Aprendizado sobre observabilidade' }
    render(<HighlightCard entryId="entry-1" highlight={noMetric} defaultOpen onUpdate={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('Aprendizado sobre observabilidade')).toBeInTheDocument()
    expect(screen.queryByText('highlight.metricLabel')).not.toBeInTheDocument()
  })

  it('FR-015 — edita título/métrica/impacto/tags via PATCH e propaga só este destaque via onUpdate', async () => {
    const updated = { ...BASE_HIGHLIGHT, title: 'Título editado' }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ highlight: updated }) })
    )
    const onUpdate = vi.fn()

    render(
      <HighlightCard entryId="entry-1" highlight={BASE_HIGHLIGHT} defaultOpen onUpdate={onUpdate} onDelete={vi.fn()} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'highlight.edit' }))
    const titleInput = screen.getByLabelText('highlight.titleLabel')
    fireEvent.change(titleInput, { target: { value: 'Título editado' } })
    fireEvent.click(screen.getByRole('button', { name: 'highlight.save' }))

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(updated))
    expect(fetch).toHaveBeenCalledWith(
      '/api/entries/entry-1/highlights/highlight-1',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('FR-015 — remove só este destaque via DELETE e chama onDelete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }))
    const onDelete = vi.fn()

    render(
      <HighlightCard entryId="entry-1" highlight={BASE_HIGHLIGHT} defaultOpen onUpdate={vi.fn()} onDelete={onDelete} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'highlight.delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'highlight.deleteConfirm.confirm' }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('highlight-1'))
    expect(fetch).toHaveBeenCalledWith(
      '/api/entries/entry-1/highlights/highlight-1',
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})
