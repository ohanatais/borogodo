import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { PanelData } from '@/lib/panel/getPanelData'

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
}))

vi.mock('@/components/features/auth/LogoutButton', () => ({
  LogoutButton: () => <button>Sair</button>,
}))

const BASE_DATA: PanelData = {
  name: 'Ana Silva',
  status: 'emerging',
  entryCount: 6,
  monthsSpan: 2,
  daysSince: 1,
  recentEntries: [],
  mirror: { headline: 'Você media conflitos com leveza.', strengthThemes: ['mediação'] },
  insight: null,
  composerPlaceholder: 'O que aconteceu no trabalho ontem?',
}

describe('PainelPage', () => {
  it('T022: renders header, mirror headline, indicators and the composer', async () => {
    mockGetPanelData.mockResolvedValueOnce(BASE_DATA)

    const { default: PainelPage } = await import('../page')
    const jsx = await PainelPage()
    render(jsx)

    expect(screen.getByText(/greeting:/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
    expect(screen.getByText('Você media conflitos com leveza.')).toBeInTheDocument()
    expect(screen.getByText('status.emerging')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('O que aconteceu no trabalho ontem?')).toBeInTheDocument()
  })

  it('T022: shows the mirror fallback when there is no snapshot yet', async () => {
    mockGetPanelData.mockResolvedValueOnce({ ...BASE_DATA, mirror: null, status: 'building' })

    const { default: PainelPage } = await import('../page')
    const jsx = await PainelPage()
    render(jsx)

    expect(screen.getByText('mirror.fallback')).toBeInTheDocument()
  })
})
