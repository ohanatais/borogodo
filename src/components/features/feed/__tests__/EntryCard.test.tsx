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
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) => fetchPromise)
    vi.stubGlobal('fetch', fetchMock)

    render(<EntryCard item={BASE_ITEM} variant="feed" />)
    expandCard()
    fireEvent.click(screen.getByRole('button', { name: 'organize.cta' }))
    fireEvent.click(screen.getByRole('button', { name: 'organize.organizing' }))

    const organizeCalls = fetchMock.mock.calls.filter(([url]) => url === '/api/entries/entry-1/organize')
    expect(organizeCalls).toHaveLength(1)
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

describe('EntryCard — contexto por pílulas (US2, feature 026)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('T032 — sinaliza "contexto não identificado" de forma discreta quando nem empresa nem projeto pessoal foram resolvidos (FR-008)', () => {
    render(<EntryCard item={BASE_ITEM} variant="feed" contextVocabulary={[]} />)

    expect(screen.getByText('context.unresolvedLabel')).toBeInTheDocument()
  })

  it('não mostra a sinalização de contexto não identificado quando a empresa já está resolvida', () => {
    render(<EntryCard item={{ ...BASE_ITEM, company: 'Acme Corp' }} variant="feed" contextVocabulary={['Acme Corp']} />)

    expect(screen.queryByText('context.unresolvedLabel')).not.toBeInTheDocument()
  })

  it('não mostra a sinalização quando "Projeto pessoal" foi selecionado, mesmo sem empresa', () => {
    render(<EntryCard item={{ ...BASE_ITEM, is_personal_project: true }} variant="feed" contextVocabulary={[]} />)

    expect(screen.queryByText('context.unresolvedLabel')).not.toBeInTheDocument()
  })

  it('T030 — renderiza o ContextPillPicker dentro do card expandido, com o vocabulário recebido', () => {
    render(<EntryCard item={BASE_ITEM} variant="feed" contextVocabulary={['Acme Corp']} />)
    expandCard()

    expect(screen.getByRole('button', { name: 'Acme Corp' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'context.personalProjectLabel' })).toBeInTheDocument()
  })

  it('propaga a seleção de pílula via onContextChange', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    const onContextChange = vi.fn()
    render(
      <EntryCard item={BASE_ITEM} variant="feed" contextVocabulary={['Acme Corp']} onContextChange={onContextChange} />
    )
    expandCard()

    fireEvent.click(screen.getByRole('button', { name: 'Acme Corp' }))

    await waitFor(() =>
      expect(onContextChange).toHaveBeenCalledWith('entry-1', { company: 'Acme Corp', isPersonalProject: false })
    )
  })
})
