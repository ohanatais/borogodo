import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SourceCard } from '../SourceCard'
import type { FeedHighlight, FeedItem } from '@/lib/feed/types'

function baseItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: 'entry-1',
    title: 'Reunião de planejamento trimestral',
    what_i_did: 'Reunião de planejamento trimestral com o time',
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
    highlights: [],
    organizationStatus: 'not_organized',
    contextStatus: 'unresolved',
    ...overrides,
  }
}

const HIGHLIGHT_A: FeedHighlight = {
  id: 'highlight-a',
  title: 'Redução de 50% no tempo de investigação de bug crítico',
  metric: '50%',
  impact: 'Menos tempo parado no time',
  tags: ['devops'],
}

const HIGHLIGHT_B: FeedHighlight = {
  id: 'highlight-b',
  title: 'Mentoria de dois devs júnior no time',
  metric: null,
  impact: 'Time mais autônomo',
  tags: ['mentoria'],
}

function expandCard() {
  fireEvent.click(screen.getByRole('button', { name: 'card.expand' }))
}

function mockFetchJson(handler: (url: string, init?: RequestInit) => { ok: boolean; body: unknown }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const { ok, body } = handler(url, init)
      return { ok, json: async () => body }
    })
  )
}

describe('SourceCard — múltiplos destaques dentro de uma fonte (US4/US7, feature 026)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('T057/US7 — destaques já vêm prontos em item.highlights, sem nenhum fetch ao expandir', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<SourceCard item={baseItem({ highlights: [HIGHLIGHT_A] })} variant="feed" />)
    expandCard()

    expect(screen.getByText(HIGHLIGHT_A.title as string)).toBeInTheDocument()
    // FR-017: 1 destaque = sempre aberto por padrão, impacto visível sem clicar em nada.
    expect(screen.getByText('Menos tempo parado no time')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalledWith('/api/entries/entry-1/highlights')
  })

  it('FR-017 — colapsa por padrão quando há múltiplos destaques', () => {
    render(<SourceCard item={baseItem({ highlights: [HIGHLIGHT_A, HIGHLIGHT_B] })} variant="feed" />)
    expandCard()

    expect(screen.getByText(HIGHLIGHT_A.title as string)).toBeInTheDocument()
    expect(screen.getByText(HIGHLIGHT_B.title as string)).toBeInTheDocument()
    expect(screen.queryByText('Menos tempo parado no time')).not.toBeInTheDocument()
    expect(screen.queryByText('Time mais autônomo')).not.toBeInTheDocument()
  })

  it('FR-016 — "+ adicionar destaque" cria um destaque em branco via POST, aberto por padrão', async () => {
    mockFetchJson((url, init) => {
      if (url === '/api/entries/entry-1/highlights' && init?.method === 'POST') {
        const blank: FeedHighlight = { id: 'highlight-new', title: null, metric: null, impact: null, tags: [] }
        return { ok: true, body: { highlight: blank } }
      }
      throw new Error(`unexpected fetch ${url} ${init?.method}`)
    })

    render(<SourceCard item={baseItem({ highlights: [HIGHLIGHT_A] })} variant="feed" />)
    expandCard()
    fireEvent.click(screen.getByRole('button', { name: 'highlight.addNew' }))

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/entries/entry-1/highlights',
        expect.objectContaining({ method: 'POST' })
      )
    )
    await waitFor(() => expect(screen.getByText('highlight.untitled')).toBeInTheDocument())
  })

  it('FR-015 — remover um destaque afeta só ele, os demais continuam na lista', async () => {
    mockFetchJson((url, init) => {
      if (url === '/api/entries/entry-1/highlights/highlight-a' && init?.method === 'DELETE') {
        return { ok: true, body: { ok: true } }
      }
      throw new Error(`unexpected fetch ${url} ${init?.method}`)
    })

    render(<SourceCard item={baseItem({ highlights: [HIGHLIGHT_A, HIGHLIGHT_B] })} variant="feed" />)
    expandCard()

    // Múltiplos destaques nascem colapsados (FR-017) — expande o primeiro para achar o botão de excluir.
    fireEvent.click(screen.getAllByRole('button', { name: 'highlight.expand' })[0])
    const deleteButtons = screen.getAllByRole('button', { name: 'highlight.delete' })
    fireEvent.click(deleteButtons[0])
    fireEvent.click(screen.getByRole('button', { name: 'highlight.deleteConfirm.confirm' }))

    await waitFor(() => expect(screen.queryByText(HIGHLIGHT_A.title as string)).not.toBeInTheDocument())
    expect(screen.getByText(HIGHLIGHT_B.title as string)).toBeInTheDocument()
  })

  it('T057/FR-032 — fonte legada com destaque sintético único (sem entry_highlights) funciona igual a uma fonte com 1 destaque real', () => {
    const synthetic: FeedHighlight = { id: 'entry-1', title: 'Resolveu bug crítico', metric: null, impact: null, tags: [] }

    render(<SourceCard item={baseItem({ highlights: [synthetic] })} variant="feed" />)
    expandCard()

    expect(screen.getByText('Resolveu bug crítico')).toBeInTheDocument()
  })
})
