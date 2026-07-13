import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { PanelData } from '@/lib/panel/getPanelData'
import { FIRST_MIRROR_MIN_ENTRIES } from '@/lib/ai/mirror/maybeRegenerate'

// T046 (US5, FR-021/FR-022): conta sem registros mostra o modo "novo" — gatilho de Registro,
// botão "Importar currículo ou LinkedIn" visível e NÃO funcional (sem erro no console ao
// clicar), e cartão de progresso 0/FIRST_MIRROR_MIN_ENTRIES (mesmo limiar do primeiro espelho,
// sem inventar um número novo).

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

const EMPTY_DATA: PanelData = {
  name: 'Ana Silva',
  avatarUrl: null,
  status: 'building',
  entryCount: 0,
  monthsSpan: null,
  daysSince: null,
  recentEntries: [],
  mirror: null,
  insight: null,
  composerPlaceholder: 'O que aconteceu no trabalho ontem?',
  returnSignal: { type: 'welcome', strengthAha: false, entry: null },
  reviewCycleSignal: { type: 'none' },
}

describe('PainelPage — modo "novo" (US5)', () => {
  it('mostra gatilho de Registro, botão Importar (visível, sem ação) e progresso 0/N', async () => {
    mockGetPanelData.mockResolvedValueOnce(EMPTY_DATA)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { default: PainelPage } = await import('../../../src/app/[locale]/(app)/painel/page')
    render(await PainelPage())

    expect(screen.getByLabelText('ariaLabel')).toBeInTheDocument()

    const importButton = screen.getByText('newAccount.importButton')
    expect(importButton).toBeInTheDocument()
    // Vitrine, sem ação (FR-021): não é um link de navegação.
    expect(importButton.closest('a')).toBeNull()

    fireEvent.click(importButton)
    expect(consoleError).not.toHaveBeenCalled()

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', String(FIRST_MIRROR_MIN_ENTRIES))
    expect(screen.getByTestId('mirror-progress-count')).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('não mostra "Suas forças" nem "Registros recentes" no modo novo', async () => {
    mockGetPanelData.mockResolvedValueOnce(EMPTY_DATA)

    const { default: PainelPage } = await import('../../../src/app/[locale]/(app)/painel/page')
    render(await PainelPage())

    expect(screen.queryByText('viewMirror')).not.toBeInTheDocument()
    expect(screen.queryByText('viewAll')).not.toBeInTheDocument()
  })
})
