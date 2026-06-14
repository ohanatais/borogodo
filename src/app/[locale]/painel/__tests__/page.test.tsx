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
  timelineEntries: [],
  highlights: [],
  mirror: { headline: 'Você media conflitos com leveza.', strengthThemes: ['mediação'] },
  insight: null,
  composerPlaceholder: 'O que aconteceu no trabalho ontem?',
}

describe('PainelPage', () => {
  it('T022: renders header, mirror headline, BorogodoCard and the composer', async () => {
    mockGetPanelData.mockResolvedValueOnce(BASE_DATA)

    const { default: PainelPage } = await import('../page')
    const jsx = await PainelPage()
    render(jsx)

    expect(screen.getByText(/greeting:/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
    // BorogodoCard renders the headline and the "ver espelho" link key
    expect(screen.getByText('Você media conflitos com leveza.')).toBeInTheDocument()
    expect(screen.getByText('viewMirror')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('O que aconteceu no trabalho ontem?')).toBeInTheDocument()
  })

  it('T022: shows BorogodoCard empty state when mirror is null and fewer than 3 entries', async () => {
    mockGetPanelData.mockResolvedValueOnce({ ...BASE_DATA, mirror: null, status: 'building', entryCount: 1 })

    const { default: PainelPage } = await import('../page')
    const jsx = await PainelPage()
    render(jsx)

    // BorogodoCard empty state: h2 with formingOf + name + formingSuffix, plus formingSubtitle
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.textContent).toMatch(/formingOf/)
    expect(screen.getByText('formingSubtitle')).toBeInTheDocument()
  })
})
