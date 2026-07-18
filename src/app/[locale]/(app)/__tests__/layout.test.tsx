import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CURRENT_TERMS_VERSION } from '@/lib/legal/policy'

const mockRedirect = vi.hoisted(() => vi.fn())
const mockGetUser = vi.hoisted(() => vi.fn())
const mockMaybeSingle = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
  useRouter: vi.fn(() => ({ refresh: vi.fn(), push: vi.fn() })),
  usePathname: vi.fn(() => '/painel'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// A mesma query `from(...).select(...)` atende dois usos no layout: o perfil (encerra em
// `.maybeSingle()`) e o vocabulário de contextos (`getContextVocabulary`, encadeia
// `.eq().not().order()` e é aguardada direto, sem terminal explícito) — o builder precisa
// suportar as duas formas.
function makeQueryBuilder(): Record<string, unknown> {
  const builder: Record<string, unknown> = {
    eq: vi.fn(() => builder),
    not: vi.fn(() => builder),
    order: vi.fn(() => builder),
    maybeSingle: mockMaybeSingle,
    then: (resolve: (value: { data: never[]; error: null }) => unknown) => resolve({ data: [], error: null }),
  }
  return builder
}

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: vi.fn(() => makeQueryBuilder()),
    })),
  })),
}))

import AppLayout from '../layout'

describe('(app) layout — gate order: auth → onboarding → termos (024/T025)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login when there is no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await AppLayout({ children: <div /> })

    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('redirects to /bem-vindo when onboarding is not completed', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockMaybeSingle.mockResolvedValue({
      data: { name: 'Ana', onboarding_completed: false, terms_version: CURRENT_TERMS_VERSION },
    })

    await AppLayout({ children: <div /> })

    expect(mockRedirect).toHaveBeenCalledWith('/bem-vindo')
  })

  it('redirects to /consentimento when terms_version is stale', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockMaybeSingle.mockResolvedValue({
      data: { name: 'Ana', onboarding_completed: true, terms_version: 'versão-antiga' },
    })

    await AppLayout({ children: <div /> })

    expect(mockRedirect).toHaveBeenCalledWith('/consentimento')
  })

  it('redirects to /consentimento when terms_version is null (account predates 024)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockMaybeSingle.mockResolvedValue({
      data: { name: 'Ana', onboarding_completed: true, terms_version: null },
    })

    await AppLayout({ children: <div /> })

    expect(mockRedirect).toHaveBeenCalledWith('/consentimento')
  })

  it('does not redirect when the account is fully up to date', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockMaybeSingle.mockResolvedValue({
      data: { name: 'Ana', onboarding_completed: true, terms_version: CURRENT_TERMS_VERSION },
    })

    const jsx = await AppLayout({ children: <div>conteúdo</div> })
    render(jsx)

    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
