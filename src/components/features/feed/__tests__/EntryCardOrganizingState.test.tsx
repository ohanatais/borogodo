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
  is_personal_project: false,
  role_title: null,
  metric: null,
  tags: [],
  thumbnail: null,
  evidences: [],
  impact: null,
  decision: null,
  learning: null,
  file_name: null,
  organized_at: null,
  organizing_started_at: null,
}

function expandCard() {
  fireEvent.click(screen.getByRole('button', { name: 'card.expand' }))
}

describe('EntryCard — estado transitório "organizando…" da organização assíncrona (US3, feature 026)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('T039 — mostra "organizando…" no header quando organizing_started_at é recente, mesmo sem clicar em Organizar', () => {
    const recentlyStarted = new Date().toISOString()
    render(<EntryCard item={{ ...BASE_ITEM, organizing_started_at: recentlyStarted }} variant="feed" />)

    expect(screen.getByText('organize.organizing')).toBeInTheDocument()
  })

  it('não mostra "organizando…" quando organizing_started_at é null (nunca organizado)', () => {
    render(<EntryCard item={BASE_ITEM} variant="feed" />)

    expect(screen.queryByText('organize.organizing')).not.toBeInTheDocument()
  })

  it('não mostra "organizando…" quando organizing_started_at está travado além do timeout (FR-030)', () => {
    const staleStartedAt = new Date(Date.now() - 5 * 60_000).toISOString()
    render(<EntryCard item={{ ...BASE_ITEM, organizing_started_at: staleStartedAt }} variant="feed" />)

    expect(screen.queryByText('organize.organizing')).not.toBeInTheDocument()
  })

  it('sem rótulo persistente nem CTA extra depois de concluído (FR-011) — some assim que organized_at está setado', () => {
    render(<EntryCard item={{ ...BASE_ITEM, organized_at: new Date().toISOString() }} variant="feed" />)

    expect(screen.queryByText('organize.organizing')).not.toBeInTheDocument()
  })

  it('botão "Organizar" já nasce desabilitado e com o rótulo "organizando…" quando a organização assíncrona já está em andamento (evita clique duplicado, FR-031)', () => {
    const recentlyStarted = new Date().toISOString()
    render(<EntryCard item={{ ...BASE_ITEM, organizing_started_at: recentlyStarted }} variant="feed" />)
    expandCard()

    const button = screen.getByRole('button', { name: 'organize.organizing' })
    expect(button).toBeDisabled()
  })

  it('clicar em Organizar enquanto a versão assíncrona já roda não dispara uma segunda chamada de rede', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const recentlyStarted = new Date().toISOString()

    render(<EntryCard item={{ ...BASE_ITEM, organizing_started_at: recentlyStarted }} variant="feed" />)
    expandCard()
    fireEvent.click(screen.getByRole('button', { name: 'organize.organizing' }))

    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled())
  })

  it('botão mostra "Organizar de novo" quando organized_at já está setado, sem precisar clicar', () => {
    render(<EntryCard item={{ ...BASE_ITEM, organized_at: new Date().toISOString() }} variant="feed" />)
    expandCard()

    expect(screen.getByRole('button', { name: 'organize.ctaAgain' })).toBeInTheDocument()
  })
})
