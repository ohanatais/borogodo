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
  timelineEntries: [],
  mirror: { headline: 'Você media conflitos com leveza.', strengthThemes: ['mediação'], skillSummary: null },
  insight: null,
  composerPlaceholder: 'O que aconteceu no trabalho ontem?',
  returnSignal: { type: 'welcome', strengthAha: false, entry: null },
}

describe('PainelPage', () => {
  it('T022: renders BorogodoCard with mirror headline', async () => {
    mockGetPanelData.mockResolvedValueOnce(BASE_DATA)

    const { default: PainelPage } = await import('../page')
    const jsx = await PainelPage()
    render(jsx)

    expect(screen.getByText('Você media conflitos com leveza.')).toBeInTheDocument()
    expect(screen.getByText('viewMirror')).toBeInTheDocument()
  })

  it('T022: shows BorogodoCard empty state when mirror is null and fewer than 3 entries', async () => {
    mockGetPanelData.mockResolvedValueOnce({
      ...BASE_DATA,
      mirror: null,
      status: 'building',
      entryCount: 1,
    })

    const { default: PainelPage } = await import('../page')
    const jsx = await PainelPage()
    render(jsx)

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.textContent).toMatch(/formingOf/)
    expect(screen.getByText('formingSubtitle')).toBeInTheDocument()
  })
})
