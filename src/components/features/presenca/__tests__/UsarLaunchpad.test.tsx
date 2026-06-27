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

  it('o card Bio abre o seletor de foco; escolher um tema gera a mini-bio com esse ângulo', () => {
    render(<UsarLaunchpad themes={['produto 0→1']} />)
    // Clicar em Bio não gera direto — abre o seletor de foco (021).
    act(() => {
      screen.getByRole('button', { name: 'cards.bio' }).click()
    })
    expect(presenca).toBeNull()
    // Escolher o tema como foco gera a mini-bio ancorada nesse ângulo.
    act(() => {
      screen.getByRole('button', { name: 'produto 0→1' }).click()
    })
    expect(presenca?.formats).toEqual(['mini_bio'])
    expect(presenca?.angle).toBe('produto 0→1')
  })

  it('o foco "Geral" gera a mini-bio sem fixar num único tema', () => {
    render(<UsarLaunchpad themes={['produto 0→1']} />)
    act(() => {
      screen.getByRole('button', { name: 'cards.bio' }).click()
    })
    act(() => {
      screen.getByRole('button', { name: 'bioFocus.geral' }).click()
    })
    expect(presenca?.formats).toEqual(['mini_bio'])
    expect(presenca?.seedSummary).toBe('bioFocus.geral')
  })

  it('escolher um momento abre a bifurcação de preparação', () => {
    render(<UsarLaunchpad themes={['produto 0→1']} />)
    act(() => {
      screen.getByRole('button', { name: /moments\.entrevista/ }).click()
    })
    expect(screen.getByText('prepare.heading')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /prepare\.ready/ })).toBeInTheDocument()
  })

  it('sem temas, os cards de mostrar ficam desabilitados e avisam para gerar o Espelho', () => {
    render(<UsarLaunchpad themes={[]} />)
    expect(screen.getByRole('button', { name: 'cards.post' })).toBeDisabled()
    expect(screen.getByText('prepare.noTheme')).toBeInTheDocument()
  })
})
