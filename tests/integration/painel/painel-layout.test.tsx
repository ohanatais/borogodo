import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { PanelData } from '@/lib/panel/getPanelData'

// T044 (US5): o Painel com dados renderiza o novo layout de coluna única — saudação, gatilho
// único, "Suas forças", "Registros recentes" — e não mais o cartão pesado de Espelho
// (BorogodoCard) nem o empty state antigo. Este teste roda o server component da página
// diretamente (mesmo padrão de `page.test.tsx`), sem montar o AppShellClient (a barra fixa
// "Registrar | Perguntar" é responsabilidade do shell, não da página).

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
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
  status: 'active',
  entryCount: 6,
  monthsSpan: 2,
  daysSince: 1,
  recentEntries: [
    {
      id: 'e1',
      what_i_did: 'Resolvi um incidente',
      title: 'Resolvi um incidente',
      source: 'deposito',
      entry_date: '2026-07-01',
      created_at: '2026-07-01T10:00:00Z',
      metric: null,
      company: null,
    },
  ],
  mirror: { headline: 'Você media conflitos com leveza.', strengthThemes: ['mediação', 'clareza'], skillSummary: null },
  insight: null,
  composerPlaceholder: 'O que aconteceu no trabalho ontem?',
  returnSignal: { type: 'welcome', strengthAha: false, entry: null },
  reviewCycleSignal: { type: 'none' },
}

describe('PainelPage — layout novo (US5)', () => {
  it('renderiza saudação, gatilho único, Suas forças e Registros recentes', async () => {
    mockGetPanelData.mockResolvedValueOnce(BASE_DATA)

    const { default: PainelPage } = await import('../../../src/app/[locale]/(app)/painel/page')
    render(await PainelPage())

    // Saudação (a hora real do teste decide manhã/tarde/noite; só confirmamos a chave usada)
    expect(screen.getByText((content) => content.startsWith('greetingByTime.'))).toBeInTheDocument()
    // Gatilho único de Registro
    expect(screen.getByLabelText('ariaLabel')).toBeInTheDocument()
    // Suas forças (mock de i18n devolve a mesma chave "title" p/ ambas as seções — 2 ocorrências)
    expect(screen.getAllByText('title')).toHaveLength(2)
    expect(screen.getByText('viewMirror')).toBeInTheDocument()
    // Registros recentes
    expect(screen.getByText('viewAll')).toBeInTheDocument()
  })

  it('não renderiza mais o cartão pesado de Espelho (BorogodoCard)', async () => {
    mockGetPanelData.mockResolvedValueOnce(BASE_DATA)

    const { default: PainelPage } = await import('../../../src/app/[locale]/(app)/painel/page')
    render(await PainelPage())

    expect(screen.queryByText('viewMirrorGrowth')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Perfil de/)).not.toBeInTheDocument()
  })

  it('não renderiza o empty state antigo (PanelEmptyState) quando há registros', async () => {
    mockGetPanelData.mockResolvedValueOnce(BASE_DATA)

    const { default: PainelPage } = await import('../../../src/app/[locale]/(app)/painel/page')
    render(await PainelPage())

    expect(screen.queryByText('empty.title')).not.toBeInTheDocument()
  })
})
