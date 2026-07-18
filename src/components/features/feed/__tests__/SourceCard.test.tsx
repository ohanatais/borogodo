import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SourceCard } from '../SourceCard'
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
  highlights: [],
  organizationStatus: 'not_organized' as const,
  contextStatus: 'unresolved' as const,
}

function expandCard() {
  fireEvent.click(screen.getByRole('button', { name: 'card.expand' }))
}

describe('SourceCard — botão Organizar (US1, feature 026)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('mostra o CTA "organize.cta" quando a fonte ainda não foi organizada', () => {
    render(<SourceCard item={BASE_ITEM} variant="feed" />)
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

    render(<SourceCard item={BASE_ITEM} variant="feed" />)
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

    render(<SourceCard item={BASE_ITEM} variant="feed" />)
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

    render(<SourceCard item={BASE_ITEM} variant="feed" />)
    expandCard()
    fireEvent.click(screen.getByRole('button', { name: 'organize.cta' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'organize.cta' })).toBeInTheDocument())
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('volta para o estado "Organizar" quando a chamada de rede falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    render(<SourceCard item={BASE_ITEM} variant="feed" />)
    expandCard()
    fireEvent.click(screen.getByRole('button', { name: 'organize.cta' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'organize.cta' })).toBeInTheDocument())
  })
})

describe('SourceCard — contexto por pílulas (US2, feature 026)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('T032 — sinaliza "contexto não identificado" de forma discreta quando nem empresa nem projeto pessoal foram resolvidos (FR-008)', () => {
    render(<SourceCard item={BASE_ITEM} variant="feed" />)

    expect(screen.getByText('context.unresolvedLabel')).toBeInTheDocument()
  })

  it('não mostra a sinalização de contexto não identificado quando a empresa já está resolvida', () => {
    render(<SourceCard item={{ ...BASE_ITEM, company: 'Acme Corp' }} variant="feed" />)

    expect(screen.queryByText('context.unresolvedLabel')).not.toBeInTheDocument()
  })

  it('não mostra a sinalização quando "Projeto pessoal" foi selecionado, mesmo sem empresa', () => {
    render(<SourceCard item={{ ...BASE_ITEM, is_personal_project: true }} variant="feed" />)

    expect(screen.queryByText('context.unresolvedLabel')).not.toBeInTheDocument()
  })

  // Revisão pós-implementação: o ContextPillPicker saiu do card expandido (poluía o card com uma
  // fileira de pílulas redundante com o próprio texto "· Empresa" já mostrado no cabeçalho).
  // Empresa/projeto pessoal agora só se editam via Drawer ("Editar") — cobertura em
  // DetailsFields.test.tsx e ContextPillPicker.test.tsx.
})

describe('SourceCard — 1 card por fonte (T058, US7, FR-025/FR-027)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('FR-025 — mostra o selo de contagem quando a fonte tem mais de 1 destaque', () => {
    render(
      <SourceCard
        item={{
          ...BASE_ITEM,
          highlights: [
            { id: 'h1', title: 'Destaque 1', metric: null, impact: null, tags: [] },
            { id: 'h2', title: 'Destaque 2', metric: null, impact: null, tags: [] },
            { id: 'h3', title: 'Destaque 3', metric: null, impact: null, tags: [] },
          ],
        }}
        variant="feed"
      />
    )

    expect(screen.getByText('card.highlightsBadge')).toBeInTheDocument()
  })

  it('FR-025 — não mostra selo quando a fonte tem exatamente 1 destaque', () => {
    render(
      <SourceCard
        item={{ ...BASE_ITEM, highlights: [{ id: 'h1', title: 'Único destaque', metric: null, impact: null, tags: [] }] }}
        variant="feed"
      />
    )

    expect(screen.queryByText('card.highlightsBadge')).not.toBeInTheDocument()
  })

  it('FR-027 — mostra a miniatura real da imagem anexada em vez do ícone genérico por tipo', () => {
    render(<SourceCard item={{ ...BASE_ITEM, thumbnail: 'https://cdn.example.com/foto.png' }} variant="feed" />)

    const thumb = screen.getByRole('presentation', { hidden: true })
    expect(thumb).toHaveAttribute('src', 'https://cdn.example.com/foto.png')
  })

  it('FR-027 — sem evidência de imagem, mostra o ícone genérico por tipo (comportamento herdado)', () => {
    render(<SourceCard item={{ ...BASE_ITEM, thumbnail: null }} variant="feed" />)

    expect(screen.queryByRole('presentation', { hidden: true })).not.toBeInTheDocument()
  })

  it('Acceptance Scenario 6 (US7) — sinalização de contexto não identificado permanece discreta no header, não um badge de alerta', () => {
    render(<SourceCard item={{ ...BASE_ITEM, company: null, is_personal_project: false }} variant="feed" />)

    const unresolved = screen.getByText('context.unresolvedLabel')
    expect(unresolved).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('SourceCard — "Editar" abre o Drawer preenchido com o registro (026)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('clicar em Editar dispara o evento de abrir o Drawer em modo edição, com a fonte pré-preenchida', () => {
    const listener = vi.fn()
    window.addEventListener('borogodo:open-drawer', listener)

    render(
      <SourceCard
        item={{ ...BASE_ITEM, metric: '50%', impact: 'reduziu retrabalho', company: 'Acme', entry_date: '2026-03-01' }}
        variant="feed"
      />
    )
    expandCard()
    fireEvent.click(screen.getByRole('button', { name: 'card.edit' }))

    expect(listener).toHaveBeenCalledTimes(1)
    const detail = (listener.mock.calls[0][0] as CustomEvent).detail
    expect(detail.editEntry).toEqual({
      id: 'entry-1',
      rawText: BASE_ITEM.what_i_did,
      manualFields: {
        metric: '50%',
        impact: 'reduziu retrabalho',
        tags: '',
        company: 'Acme',
        isPersonalProject: false,
        entryDate: '2026-03-01',
      },
    })

    window.removeEventListener('borogodo:open-drawer', listener)
  })

  it('não abre o Drawer nem edita nada por engano — não existe mais edição inline no card', () => {
    render(<SourceCard item={BASE_ITEM} variant="feed" />)
    expandCard()

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'card.save' })).not.toBeInTheDocument()
  })
})

describe('SourceCard — exclusão com confirmação', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('abre o diálogo de confirmação e só chama onDelete após confirmar', () => {
    const onDelete = vi.fn()
    render(<SourceCard item={BASE_ITEM} variant="feed" onDelete={onDelete} />)
    expandCard()

    fireEvent.click(screen.getByRole('button', { name: 'card.delete' }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByText('card.deleteConfirm.title')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'card.deleteConfirm.confirm' }))
    expect(onDelete).toHaveBeenCalledWith('entry-1')
  })

  it('não mostra o botão de excluir quando onDelete não é fornecido', () => {
    render(<SourceCard item={BASE_ITEM} variant="feed" />)
    expandCard()

    expect(screen.queryByRole('button', { name: 'card.delete' })).not.toBeInTheDocument()
  })
})

describe('SourceCard — variant "panel" (sem ações de Registros)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('não renderiza botão Organizar, editar ou excluir', () => {
    render(<SourceCard item={BASE_ITEM} variant="panel" onDelete={vi.fn()} />)
    expandCard()

    expect(screen.queryByRole('button', { name: 'organize.cta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'card.edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'card.delete' })).not.toBeInTheDocument()
  })
})

describe('SourceCard — "Ver fonte completa" nunca força scroll de página inteira', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('texto cru vem oculto por padrão, atrás do toggle "Ver fonte completa"', () => {
    render(<SourceCard item={BASE_ITEM} variant="feed" />)
    expandCard()

    expect(screen.getByRole('button', { name: 'card.viewFull' })).toBeInTheDocument()
    expect(screen.queryByText(BASE_ITEM.what_i_did)).not.toBeInTheDocument()
  })

  it('clicar no toggle revela o texto cru completo, mesmo sendo grande, num container com scroll próprio', () => {
    const longText = 'Trecho da transcrição. '.repeat(40)
    render(<SourceCard item={{ ...BASE_ITEM, what_i_did: longText }} variant="feed" />)
    expandCard()

    fireEvent.click(screen.getByRole('button', { name: 'card.viewFull' }))

    expect(screen.getByRole('button', { name: 'card.hideFull' })).toBeInTheDocument()
    expect(screen.getByText(longText.trim())).toBeInTheDocument()
  })
})
