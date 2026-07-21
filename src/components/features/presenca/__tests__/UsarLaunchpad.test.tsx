import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { UsarLaunchpad } from '../UsarLaunchpad'
import { PRESENCA_OPEN_EVENT, type PresencaOpenDetail } from '@/components/features/content/presencaEvents'

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  }
})

describe('UsarLaunchpad', () => {
  let presenca: PresencaOpenDetail | null = null
  const onPresenca = (e: Event) => {
    presenca = (e as CustomEvent<PresencaOpenDetail>).detail
  }

  beforeEach(() => {
    presenca = null
    window.addEventListener(PRESENCA_OPEN_EVENT, onPresenca)
  })
  afterEach(() => window.removeEventListener(PRESENCA_OPEN_EVENT, onPresenca))

  it('mostra os dois hubs por intenção', () => {
    render(<UsarLaunchpad themes={['produto 0→1']} />)
    expect(screen.getByText('hubs.mostrar.title')).toBeInTheDocument()
    expect(screen.getByText('hubs.preparar.title')).toBeInTheDocument()
  })

  it('o card Post gera um post a partir do tema principal', () => {
    render(<UsarLaunchpad themes={['produto 0→1', 'liderança']} />)
    act(() => {
      screen.getByRole('button', { name: 'cards.post' }).click()
    })
    expect(presenca).toEqual({
      seedType: 'theme',
      seedRef: 'produto 0→1',
      seedSummary: 'produto 0→1',
      formats: ['post'],
    })
  })

  it('não oferece criação de bio', () => {
    render(<UsarLaunchpad themes={['produto 0→1']} />)
    expect(screen.queryByRole('button', { name: 'cards.bio' })).not.toBeInTheDocument()
  })

  it('escolher um momento abre o chat diretamente, sem bifurcação', () => {
    let detail: unknown = null
    const listener = (event: Event) => { detail = (event as CustomEvent).detail }
    window.addEventListener('borogodo:chat-open', listener)
    render(<UsarLaunchpad themes={['produto 0→1']} />)
    act(() => {
      screen.getByRole('button', { name: /moments\.entrevista/ }).click()
    })
    expect(detail).toEqual({ context: { type: 'preparacao', moment: 'entrevista' } })
    expect(screen.queryByText('prepare.heading')).not.toBeInTheDocument()
    window.removeEventListener('borogodo:chat-open', listener)
  })

  it('sem temas, os cards de mostrar ficam desabilitados e avisam para gerar o Espelho', () => {
    render(<UsarLaunchpad themes={[]} />)
    expect(screen.getByRole('button', { name: 'cards.post' })).toBeDisabled()
    expect(screen.getByText('prepare.noTheme')).toBeInTheDocument()
  })
})
