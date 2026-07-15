import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EntryCard } from '../EntryCard'
import type { FeedItem } from '@/lib/feed/types'

const BASE_ITEM: FeedItem = {
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
}

const HIGHLIGHT_A = {
  id: 'highlight-a',
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

const HIGHLIGHT_B = {
  id: 'highlight-b',
  entry_id: 'entry-1',
  user_id: 'user-1',
  title: 'Mentoria de dois devs júnior no time',
  metric: null,
  impact: 'Time mais autônomo',
  tags: ['mentoria'],
  position: 1,
  created_at: '2026-07-10T12:00:00.000Z',
  updated_at: '2026-07-10T12:00:00.000Z',
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

describe('EntryCard — múltiplos destaques dentro de uma fonte (US4, feature 026)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('T044/FR-017 — busca os destaques da fonte ao expandir e abre automaticamente quando há só 1', async () => {
    mockFetchJson((url) => {
      if (url === '/api/entries/entry-1/highlights') return { ok: true, body: { highlights: [HIGHLIGHT_A] } }
      throw new Error(`unexpected fetch ${url}`)
    })

    render(<EntryCard item={BASE_ITEM} variant="feed" />)
    expandCard()

    await waitFor(() => expect(screen.getByText(HIGHLIGHT_A.title)).toBeInTheDocument())
    // 1 destaque = sempre aberto por padrão (FR-017): impacto visível sem clicar em nada.
    expect(await screen.findByText('Menos tempo parado no time')).toBeInTheDocument()
  })

  it('FR-017 — colapsa por padrão quando há múltiplos destaques', async () => {
    mockFetchJson((url) => {
      if (url === '/api/entries/entry-1/highlights') return { ok: true, body: { highlights: [HIGHLIGHT_A, HIGHLIGHT_B] } }
      throw new Error(`unexpected fetch ${url}`)
    })

    render(<EntryCard item={BASE_ITEM} variant="feed" />)
    expandCard()

    await waitFor(() => expect(screen.getByText(HIGHLIGHT_A.title)).toBeInTheDocument())
    expect(screen.getByText(HIGHLIGHT_B.title)).toBeInTheDocument()
    expect(screen.queryByText('Menos tempo parado no time')).not.toBeInTheDocument()
    expect(screen.queryByText('Time mais autônomo')).not.toBeInTheDocument()
  })

  it('FR-016 — "+ adicionar destaque" cria um destaque em branco via POST, aberto por padrão', async () => {
    mockFetchJson((url, init) => {
      if (url === '/api/entries/entry-1/highlights' && (!init || init.method === undefined)) {
        return { ok: true, body: { highlights: [HIGHLIGHT_A] } }
      }
      if (url === '/api/entries/entry-1/highlights' && init?.method === 'POST') {
        const blank = { ...HIGHLIGHT_A, id: 'highlight-new', title: null, metric: null, impact: null, tags: [], position: 1 }
        return { ok: true, body: { highlight: blank } }
      }
      throw new Error(`unexpected fetch ${url} ${init?.method}`)
    })

    render(<EntryCard item={BASE_ITEM} variant="feed" />)
    expandCard()

    await waitFor(() => expect(screen.getByText(HIGHLIGHT_A.title)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'highlight.addNew' }))

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/entries/entry-1/highlights',
        expect.objectContaining({ method: 'POST' })
      )
    )
    // Destaque em branco recém-criado nasce aberto (campo de edição/título vazio visível).
    await waitFor(() => expect(screen.getByText('highlight.untitled')).toBeInTheDocument())
  })

  it('FR-015 — remover um destaque afeta só ele, os demais continuam na lista', async () => {
    mockFetchJson((url, init) => {
      if (url === '/api/entries/entry-1/highlights') return { ok: true, body: { highlights: [HIGHLIGHT_A, HIGHLIGHT_B] } }
      if (url === '/api/entries/entry-1/highlights/highlight-a' && init?.method === 'DELETE') {
        return { ok: true, body: { ok: true } }
      }
      throw new Error(`unexpected fetch ${url} ${init?.method}`)
    })

    render(<EntryCard item={BASE_ITEM} variant="feed" />)
    expandCard()

    await waitFor(() => expect(screen.getByText(HIGHLIGHT_A.title)).toBeInTheDocument())
    // Múltiplos destaques nascem colapsados (FR-017) — expande o primeiro para achar o botão de excluir.
    fireEvent.click(screen.getAllByRole('button', { name: 'highlight.expand' })[0])
    const deleteButtons = screen.getAllByRole('button', { name: 'highlight.delete' })
    fireEvent.click(deleteButtons[0])
    fireEvent.click(screen.getByRole('button', { name: 'highlight.deleteConfirm.confirm' }))

    await waitFor(() => expect(screen.queryByText(HIGHLIGHT_A.title)).not.toBeInTheDocument())
    expect(screen.getByText(HIGHLIGHT_B.title)).toBeInTheDocument()
  })
})
