import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { PresencaCreate } from '../PresencaCreate'
import { PRESENCA_OPEN_EVENT, type PresencaOpenDetail } from '../presencaEvents'

const THEMES = ['produto 0→1', 'liderança técnica']
const ENTRIES = [{ id: 'e-1', whatIDid: 'Liderei a migração do sistema de cobrança' }]

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

describe('PresencaCreate', () => {
  let captured: PresencaOpenDetail | null = null
  const listener = (e: Event) => {
    captured = (e as CustomEvent<PresencaOpenDetail>).detail
  }

  beforeEach(() => {
    captured = null
    window.addEventListener(PRESENCA_OPEN_EVENT, listener)
  })

  afterEach(() => {
    window.removeEventListener(PRESENCA_OPEN_EVENT, listener)
  })

  function openChooser() {
    render(<PresencaCreate themes={THEMES} entries={ENTRIES} />)
    act(() => {
      screen.getByRole('button', { name: 'create.open' }).click()
    })
  }

  it('abre o seletor com os temas e entradas como pontos de partida', async () => {
    openChooser()

    expect(await screen.findByText('create.title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'produto 0→1' })).toBeInTheDocument()
    expect(screen.getByText('Liderei a migração do sistema de cobrança')).toBeInTheDocument()
  })

  it('escolher um tema dispara a geração somente de post', async () => {
    openChooser()
    await screen.findByText('create.title')

    act(() => {
      screen.getByRole('button', { name: 'produto 0→1' }).click()
    })

    expect(captured).toEqual({
      seedType: 'theme',
      seedRef: 'produto 0→1',
      seedSummary: 'produto 0→1',
      formats: ['post'],
    })
  })

  it('escolher uma entrada dispara a geração com post (sem resumo de impacto — 021)', async () => {
    openChooser()
    await screen.findByText('create.title')

    act(() => {
      screen.getByText('Liderei a migração do sistema de cobrança').click()
    })

    expect(captured?.seedType).toBe('entry')
    expect(captured?.seedRef).toBe('e-1')
    expect(captured?.formats).toEqual(['post'])
  })

  it('sem temas nem entradas, guia a registrar primeiro (nunca um prompt vazio)', async () => {
    render(<PresencaCreate themes={[]} entries={[]} />)
    act(() => {
      screen.getByRole('button', { name: 'create.open' }).click()
    })

    expect(await screen.findByText('create.empty')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create.goRegister/ })).toHaveAttribute('href', '/painel')
  })
})
