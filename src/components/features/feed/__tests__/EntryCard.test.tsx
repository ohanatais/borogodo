import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EntryCard } from '../EntryCard'
import type { FeedItem } from '@/lib/feed/types'

const BASE_ITEM: FeedItem = {
  id: 'entry-1',
  title: 'Resolveu bug crítico',
  what_i_did: 'Resolveu bug crítico do time de plataforma',
  source: 'deposito',
  created_at: '2026-07-10T12:00:00.000Z',
  entry_date: null,
  company: null,
  role_title: null,
  metric: null,
  tags: [],
  thumbnail: null,
  evidences: [],
  impact: null,
  decision: null,
  learning: null,
  file_name: null,
}

function expandCard() {
  fireEvent.click(screen.getByRole('button', { name: 'card.expand' }))
}

describe('EntryCard — botão Organizar (US1, feature 026)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('mostra o CTA "organize.cta" quando a fonte ainda não foi organizada', () => {
    render(<EntryCard item={BASE_ITEM} variant="feed" />)
    expandCard()

    expect(screen.getByRole('button', { name: 'organize.cta' })).toBeInTheDocument()
  })

  it('ao clicar, chama POST /api/entries/[id]/organize e mostra o estado "organizando…"', async () => {
    let resolveFetch: (value: unknown) => void = () => {}
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(() => fetchPromise)
    )

    render(<EntryCard item={BASE_ITEM} variant="feed" />)
    expandCard()
    fireEvent.click(screen.getByRole('button', { name: 'organize.cta' }))

    expect(screen.getByRole('button', { name: 'organize.organizing' })).toBeDisabled()
    expect(fetch).toHaveBeenCalledWith('/api/entries/entry-1/organize', { method: 'POST' })

    resolveFetch({ ok: true, json: async () => ({ status: 'organized', highlights: [] }) })
    await waitFor(() => expect(screen.getByRole('button', { name: 'organize.ctaAgain' })).toBeInTheDocument())
  })

  it('guarda contra duplo clique — um segundo clique enquanto organiza não dispara nova chamada (FR-031)', async () => {
    let resolveFetch: (value: unknown) => void = () => {}
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve
    })
    const fetchMock = vi.fn(() => fetchPromise)
    vi.stubGlobal('fetch', fetchMock)

    render(<EntryCard item={BASE_ITEM} variant="feed" />)
    expandCard()
    fireEvent.click(screen.getByRole('button', { name: 'organize.cta' }))
    fireEvent.click(screen.getByRole('button', { name: 'organize.organizing' }))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    resolveFetch({ ok: true, json: async () => ({ status: 'organized', highlights: [] }) })
    await waitFor(() => expect(screen.getByRole('button', { name: 'organize.ctaAgain' })).toBeInTheDocument())
  })

  it('volta para o estado "Organizar" (não "de novo") quando a organização falha (FR-030, sem popup)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'failed' }) }))

    render(<EntryCard item={BASE_ITEM} variant="feed" />)
    expandCard()
    fireEvent.click(screen.getByRole('button', { name: 'organize.cta' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'organize.cta' })).toBeInTheDocument())
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('volta para o estado "Organizar" quando a chamada de rede falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    render(<EntryCard item={BASE_ITEM} variant="feed" />)
    expandCard()
    fireEvent.click(screen.getByRole('button', { name: 'organize.cta' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'organize.cta' })).toBeInTheDocument())
  })
})
