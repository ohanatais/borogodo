import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { GenerateSheet } from '../GenerateSheet'
import { PRESENCA_OPEN_EVENT } from '../presencaEvents'

const VARIANTS = [
  { angle: 'o aprendizado', body: 'Primeiro rascunho na sua voz.', evidenceRefs: ['E1'] },
  { angle: 'quem participou', body: 'Segundo rascunho na sua voz.', evidenceRefs: ['E2'] },
]

function openWith(formats: ('post' | 'impact_summary')[] = ['post']) {
  return act(async () => {
    window.dispatchEvent(
      new CustomEvent(PRESENCA_OPEN_EVENT, {
        detail: { seedType: 'theme', seedRef: 'produto 0→1', seedSummary: 'produto 0→1', formats },
      })
    )
  })
}

beforeAll(() => {
  // Radix Dialog + react-remove-scroll dependem destes em jsdom.
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

describe('GenerateSheet', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza os 2 rascunhos quando a geração responde com sucesso', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ variants: VARIANTS }),
    }) as unknown as typeof fetch

    render(<GenerateSheet />)
    await openWith()

    const cards = await screen.findAllByTestId('draft-card')
    expect(cards).toHaveLength(2)
  })

  it('mostra a evidência base assim que abre (nunca página em branco)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ variants: VARIANTS }),
    }) as unknown as typeof fetch

    render(<GenerateSheet />)
    await openWith()

    expect(await screen.findByText('produto 0→1')).toBeInTheDocument()
  })

  it('mostra estado de erro honesto quando o motor falha (422)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: 'generation_failed' }),
    }) as unknown as typeof fetch

    render(<GenerateSheet />)
    await openWith()

    // i18n mockado devolve a chave; o estado de erro renderiza a chave de erro específica.
    expect(await screen.findByText('errors.generationFailed')).toBeInTheDocument()
    expect(screen.queryAllByTestId('draft-card')).toHaveLength(0)
  })
})
