import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { PrepararMomento } from '../PrepararMomento'
import { PREP_MOMENTS } from '@/lib/content/intentions'
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

describe('PrepararMomento', () => {
  let presenca: PresencaOpenDetail | null = null
  let chat: { context?: { type: string; moment?: string } } | null = null
  const onPresenca = (e: Event) => {
    presenca = (e as CustomEvent<PresencaOpenDetail>).detail
  }
  const onChat = (e: Event) => {
    chat = (e as CustomEvent<{ context?: { type: string; moment?: string } }>).detail
  }

  beforeEach(() => {
    presenca = null
    chat = null
    window.addEventListener(PRESENCA_OPEN_EVENT, onPresenca)
    window.addEventListener('borogodo:chat-open', onChat)
  })

  afterEach(() => {
    window.removeEventListener(PRESENCA_OPEN_EVENT, onPresenca)
    window.removeEventListener('borogodo:chat-open', onChat)
  })

  it('"quero algo pronto" gera um resumo de impacto com o ângulo e o momento', () => {
    render(<PrepararMomento moment="entrevista" themeRef="produto 0→1" onBack={() => {}} />)

    act(() => {
      screen.getByRole('button', { name: /prepare\.ready/ }).click()
    })

    expect(presenca).toEqual({
      seedType: 'theme',
      seedRef: 'produto 0→1',
      seedSummary: 'moments.entrevista',
      formats: ['impact_summary'],
      angle: PREP_MOMENTS.entrevista.angleHint,
      moment: 'entrevista',
    })
  })

  it('"quero treinar conversando" abre o chat enquadrado no momento', () => {
    render(<PrepararMomento moment="salario" themeRef="produto 0→1" onBack={() => {}} />)

    act(() => {
      screen.getByRole('button', { name: /prepare\.talk/ }).click()
    })

    expect(chat?.context).toEqual({ type: 'preparacao', moment: 'salario' })
  })

  it('sem tema (Espelho ausente), o caminho "pronto" fica desabilitado e avisa', () => {
    render(<PrepararMomento moment="review" themeRef={null} onBack={() => {}} />)

    expect(screen.getByRole('button', { name: /prepare\.ready/ })).toBeDisabled()
    expect(screen.getByText('prepare.noTheme')).toBeInTheDocument()

    act(() => {
      screen.getByRole('button', { name: /prepare\.ready/ }).click()
    })
    expect(presenca).toBeNull()
  })

  it('voltar chama onBack', () => {
    const onBack = vi.fn()
    render(<PrepararMomento moment="entrevista" themeRef="x" onBack={onBack} />)
    act(() => {
      screen.getByRole('button', { name: 'prepare.back' }).click()
    })
    expect(onBack).toHaveBeenCalledOnce()
  })
})
