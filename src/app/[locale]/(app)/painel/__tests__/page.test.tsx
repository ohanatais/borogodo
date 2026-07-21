import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { PanelData } from '@/lib/panel/getPanelData'

// 025-registro-deposito (US5): o Painel trocou o cartão pesado de Espelho (`BorogodoCard`) e o
// empty state antigo (`PanelEmptyState`) pelo layout novo — saudação, gatilho único de Registro,
// "Suas forças", "Registros recentes" (com dados) e `NewAccountPrompt` (modo "novo"). Este arquivo
// substitui as asserções antigas de T022 pelas equivalentes do layout novo.

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string, params?: Record<string, string>) => {
    if (params) return `${key}:${JSON.stringify(params)}`
    return key
  }),
}))

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      })),
    },
  })),
}))

const mockGetPanelData = vi.hoisted(() => vi.fn())
vi.mock('@/lib/panel/getPanelData', () => ({ getPanelData: mockGetPanelData }))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({ refresh: vi.fn(), push: vi.fn() })),
  usePathname: vi.fn(() => '/painel'),
}))

const BASE_DATA: PanelData = {
  name: 'Ana Silva',
  avatarUrl: null,
  status: 'emerging',
  entryCount: 6,
  monthsSpan: 2,
  daysSince: 1,
  recentEntries: [],
  mirror: {
    headline: 'Você media conflitos com leveza.',
    strengthThemes: ['mediação'],
    skillSummary: null,
    skills: [{ name: 'Mediação de conflitos', tier: 'Consistente' }],
  },
  insight: null,
  composerPlaceholder: 'O que aconteceu no trabalho ontem?',
  returnSignal: { type: 'welcome', strengthAha: false, entry: null },
  reviewCycleSignal: { type: 'none' },
}

describe('PainelPage', () => {
  it('resume a distribuição sem repetir temas ou competências detalhadas do Espelho', async () => {
    mockGetPanelData.mockResolvedValueOnce(BASE_DATA)

    const { default: PainelPage } = await import('../page')
    const jsx = await PainelPage()
    render(jsx)

    expect(screen.queryByText('Mediação de conflitos')).not.toBeInTheDocument()
    expect(screen.queryByText('mediação')).not.toBeInTheDocument()
    expect(screen.getByText('tiers.Consistente')).toBeInTheDocument()
    expect(screen.getByText('viewMirror')).toBeInTheDocument()
  })

  it('025/US5: mostra NewAccountPrompt (modo "novo") quando não há mirror nem registros', async () => {
    mockGetPanelData.mockResolvedValueOnce({
      ...BASE_DATA,
      mirror: null,
      status: 'building',
      entryCount: 0,
    })

    const { default: PainelPage } = await import('../page')
    const jsx = await PainelPage()
    render(jsx)

    expect(screen.getByText('newAccount.importButton')).toBeInTheDocument()
    expect(screen.getByText(/newAccount.progressLabel/)).toBeInTheDocument()
  })

  it('021: não duplica o convite "Usar" no painel (vive no destino de topo Usar)', async () => {
    mockGetPanelData.mockResolvedValueOnce(BASE_DATA)
    const { default: PainelPage } = await import('../page')
    render(await PainelPage())
    // O card de convite ao Repertório saiu do painel — "Usar" virou destino de menu (021).
    expect(screen.queryByText('hubs.mostrar.title')).not.toBeInTheDocument()
    expect(screen.queryByText('hubs.preparar.title')).not.toBeInTheDocument()
  })
})
