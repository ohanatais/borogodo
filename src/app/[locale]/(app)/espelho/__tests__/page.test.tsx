import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}))

vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: { name: 'Ana' } })) })),
      })),
    })),
  })),
}))

const getLatestSnapshot = vi.hoisted(() => vi.fn(async () => null))
const getHistoricoData = vi.hoisted(() => vi.fn(async () => ({ companies: [] })))
vi.mock('@/lib/db/mirror', () => ({ getLatestSnapshot }))
vi.mock('@/lib/historico/getHistoricoData', () => ({ getHistoricoData }))

vi.mock('@/components/features/espelho/MirrorContent', () => ({
  MirrorContent: () => <div data-testid="forcas" />,
}))
vi.mock('@/app/[locale]/(app)/historico/HistoricoPageClient', () => ({
  HistoricoPageClient: () => <div data-testid="trajetoria" />,
}))
vi.mock('@/components/features/espelho/EspelhoViews', () => ({
  EspelhoViews: ({ vista }: { vista: string }) => <div data-testid="views" data-vista={vista} />,
}))

import EspelhoPage from '../page'

describe('EspelhoPage — 2 vistas', () => {
  beforeEach(() => {
    getLatestSnapshot.mockClear()
    getHistoricoData.mockClear()
  })

  it('?vista=forcas (default) busca Forças e NÃO busca a Trajetória', async () => {
    const { queryByTestId } = render(
      await EspelhoPage({ searchParams: Promise.resolve({ vista: 'forcas' }) })
    )
    expect(getLatestSnapshot).toHaveBeenCalledTimes(1)
    expect(getHistoricoData).not.toHaveBeenCalled()
    expect(queryByTestId('trajetoria')).toBeNull()
  })

  it('?vista=trajetoria busca a Trajetória e NÃO busca Forças', async () => {
    const { getByTestId } = render(
      await EspelhoPage({ searchParams: Promise.resolve({ vista: 'trajetoria' }) })
    )
    expect(getHistoricoData).toHaveBeenCalledTimes(1)
    expect(getLatestSnapshot).not.toHaveBeenCalled()
    expect(getByTestId('trajetoria')).toBeTruthy()
  })

  it('sem ?vista cai em Forças', async () => {
    render(await EspelhoPage({ searchParams: Promise.resolve({}) }))
    expect(getLatestSnapshot).toHaveBeenCalledTimes(1)
    expect(getHistoricoData).not.toHaveBeenCalled()
  })
})
