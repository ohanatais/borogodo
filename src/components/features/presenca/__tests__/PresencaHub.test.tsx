import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { PresencaHub } from '../PresencaHub'
import { PRESENCA_RESUME_EVENT, type PresencaResumeDetail } from '@/components/features/content/presencaEvents'
import type { Draft, DraftListPage } from '@/types/content'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'pt-BR',
}))

// Sem animação nos testes: saída de item síncrona (sem AnimatePresence segurando o nó).
const MOTION_ONLY_PROPS = ['layout', 'exit', 'transition', 'initial', 'animate', 'whileInView', 'whileHover', 'whileTap']
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: new Proxy(
    {},
    {
      get: (_t, tag: string) => (props: Record<string, unknown>) => {
        const rest: Record<string, unknown> = {}
        for (const key of Object.keys(props)) {
          if (!MOTION_ONLY_PROPS.includes(key)) rest[key] = props[key]
        }
        return React.createElement(tag, rest as Record<string, unknown>, props.children as React.ReactNode)
      },
    }
  ),
}))

const mockPatchDraft = vi.fn()
const mockDeleteDraft = vi.fn()
vi.mock('@/components/features/content/draftsClient', () => ({
  patchDraft: (...args: unknown[]) => mockPatchDraft(...args),
  deleteDraft: (...args: unknown[]) => mockDeleteDraft(...args),
}))

function draft(over: Partial<Draft> = {}): Draft {
  return {
    id: 'd1',
    format: 'post',
    seedType: 'theme',
    seedRef: 'produto 0→1',
    angle: 'o aprendizado',
    body: 'Corpo do rascunho salvo.',
    status: 'generated',
    voiceFeedback: null,
    createdAt: '2026-06-15T12:00:00Z',
    ...over,
  }
}

function page(items: Draft[], nextCursor: string | null = null): DraftListPage {
  return { items, nextCursor }
}

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  }
})

describe('PresencaHub', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPatchDraft.mockResolvedValue(draft())
    mockDeleteDraft.mockResolvedValue(true)
  })

  it('renderiza os rascunhos ativos da página inicial', () => {
    render(<PresencaHub initialPage={page([draft()])} hasAnyDrafts themes={[]} entries={[]} />)
    expect(screen.getByText('Corpo do rascunho salvo.')).toBeInTheDocument()
  })

  it('vazio pristino (sem nenhum rascunho) mostra os caminhos de entrada, nunca página em branco', () => {
    render(<PresencaHub initialPage={page([])} hasAnyDrafts={false} themes={['produto 0→1']} entries={[]} />)
    expect(screen.getByText('page.empty.title')).toBeInTheDocument()
    expect(screen.getByText('create.open')).toBeInTheDocument()
  })

  it('vazio de filtro (tem rascunhos, mas nenhum no recorte) mostra "nada neste filtro"', () => {
    render(<PresencaHub initialPage={page([])} hasAnyDrafts themes={[]} entries={[]} />)
    expect(screen.getByText('filterEmpty')).toBeInTheDocument()
    expect(screen.queryByText('page.empty.title')).not.toBeInTheDocument()
  })

  it('retomar reabre o rascunho com o corpo preservado (sem regerar)', () => {
    render(<PresencaHub initialPage={page([draft()])} hasAnyDrafts themes={[]} entries={[]} />)

    let received: PresencaResumeDetail | null = null
    const handler = (e: Event) => {
      received = (e as CustomEvent<PresencaResumeDetail>).detail
    }
    window.addEventListener(PRESENCA_RESUME_EVENT, handler)
    act(() => screen.getByRole('button', { name: /actions\.resume/ }).click())
    window.removeEventListener(PRESENCA_RESUME_EVENT, handler)

    expect(received).not.toBeNull()
    expect(received!.draftId).toBe('d1')
    expect(received!.body).toBe('Corpo do rascunho salvo.')
  })

  it('arquivar tira da lista ativa e faz PATCH para discarded', async () => {
    render(<PresencaHub initialPage={page([draft()])} hasAnyDrafts themes={[]} entries={[]} />)

    await act(async () => {
      screen.getByRole('button', { name: 'actions.archive' }).click()
    })

    expect(mockPatchDraft).toHaveBeenCalledWith('d1', { status: 'discarded' })
    await waitFor(() => expect(screen.queryByText('Corpo do rascunho salvo.')).not.toBeInTheDocument())
  })

  it('restaurar (item arquivado) faz PATCH para edited e remove da visão de arquivados', async () => {
    render(
      <PresencaHub initialPage={page([draft({ status: 'discarded' })])} hasAnyDrafts themes={[]} entries={[]} />
    )

    await act(async () => {
      screen.getByRole('button', { name: 'actions.restore' }).click()
    })

    expect(mockPatchDraft).toHaveBeenCalledWith('d1', { status: 'edited' })
  })

  it('excluir pede confirmação; confirmar chama o DELETE e tira da lista', async () => {
    render(<PresencaHub initialPage={page([draft()])} hasAnyDrafts themes={[]} entries={[]} />)

    act(() => screen.getByRole('button', { name: 'actions.delete' }).click())

    const confirm = await screen.findByRole('button', { name: 'deleteConfirm.confirm' })
    await act(async () => {
      confirm.click()
    })

    expect(mockDeleteDraft).toHaveBeenCalledWith('d1')
    await waitFor(() => expect(screen.queryByText('Corpo do rascunho salvo.')).not.toBeInTheDocument())
  })

  it('excluir e cancelar não apaga nada', async () => {
    render(<PresencaHub initialPage={page([draft()])} hasAnyDrafts themes={[]} entries={[]} />)

    act(() => screen.getByRole('button', { name: 'actions.delete' }).click())
    const cancel = await screen.findByRole('button', { name: 'deleteConfirm.cancel' })
    await act(async () => {
      cancel.click()
    })

    expect(mockDeleteDraft).not.toHaveBeenCalled()
    expect(screen.getByText('Corpo do rascunho salvo.')).toBeInTheDocument()
  })

  it('falha ao arquivar faz rollback (o item volta para a lista)', async () => {
    mockPatchDraft.mockResolvedValue(null)
    render(<PresencaHub initialPage={page([draft()])} hasAnyDrafts themes={[]} entries={[]} />)

    await act(async () => {
      screen.getByRole('button', { name: 'actions.archive' }).click()
    })

    await waitFor(() => expect(screen.getByText('Corpo do rascunho salvo.')).toBeInTheDocument())
  })
})
