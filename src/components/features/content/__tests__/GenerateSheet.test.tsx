import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { GenerateSheet } from '../GenerateSheet'
import { PRESENCA_OPEN_EVENT, PRESENCA_RESUME_EVENT } from '../presencaEvents'

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

/** Post abre no seletor de ângulo (018 US1); escolher "Relato" dispara a geração padrão. */
async function pickRelato() {
  const relato = await screen.findByRole('button', { name: 'angles.relato' })
  await act(async () => {
    relato.click()
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
    await pickRelato()

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
    await pickRelato()

    // i18n mockado devolve a chave; o estado de erro renderiza a chave de erro específica.
    expect(await screen.findByText('errors.generationFailed')).toBeInTheDocument()
    expect(screen.queryAllByTestId('draft-card')).toHaveLength(0)
  })

  it('US1/014: retomar reabre o corpo salvo sem chamar o motor (sem fetch)', async () => {
    const fetchMock = vi.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    render(<GenerateSheet />)
    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(PRESENCA_RESUME_EVENT, {
          detail: {
            draftId: 'd1',
            format: 'post',
            seedType: 'theme',
            seedRef: 'produto 0→1',
            angle: 'o aprendizado',
            body: 'Corpo já salvo, intacto.',
            seedSummary: 'produto 0→1',
          },
        })
      )
    })

    expect(await screen.findByText('Corpo já salvo, intacto.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('017: abrir com um ângulo de momento envia o angle no POST de geração', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ variants: VARIANTS }),
    })
    global.fetch = fetchMock as unknown as typeof fetch

    render(<GenerateSheet />)
    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(PRESENCA_OPEN_EVENT, {
          detail: {
            seedType: 'theme',
            seedRef: 'produto 0→1',
            seedSummary: 'Entrevista',
            formats: ['impact_summary'],
            angle: 'Enquadre para uma entrevista de emprego.',
            moment: 'entrevista',
          },
        })
      )
    })

    await screen.findAllByTestId('draft-card')
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body.angle).toBe('Enquadre para uma entrevista de emprego.')
    expect(body.format).toBe('impact_summary')
  })

  it('US3: aplicar um chip de ajuste regera o par enviando o adjust', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ variants: VARIANTS }),
    })
    global.fetch = fetchMock as unknown as typeof fetch

    render(<GenerateSheet />)
    await openWith()
    await pickRelato()
    await screen.findAllByTestId('draft-card')

    await act(async () => {
      screen.getByRole('button', { name: 'adjust.shorter' }).click()
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    const lastBody = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)
    expect(lastBody.adjust).toBe('mais_curto')
  })
})
