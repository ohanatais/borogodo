import { NextRequest, NextResponse } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()

vi.mock('@/lib/db/supabase/middleware', () => ({
  updateSession: vi.fn(async (request: NextRequest) => {
    const { NextResponse } = await import('next/server')
    const supabaseResponse = NextResponse.next({ request })
    const user = mockGetUser()
    return { user, supabaseResponse }
  }),
}))

vi.mock('next-intl/middleware', () => ({
  default: () => (_request: NextRequest) => {
    return NextResponse.next()
  },
}))

const makeRequest = (pathname: string) =>
  new NextRequest(`http://localhost${pathname}`)

describe('middleware — route protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('T010: unauthenticated access to /painel redirects to /login', async () => {
    mockGetUser.mockReturnValue(null)
    const { default: middleware } = await import('@/proxy')
    const request = makeRequest('/painel')
    const response = await middleware(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
  })

  it('T011: authenticated user accessing /login redirects to /painel', async () => {
    mockGetUser.mockReturnValue({ id: 'user-123', email: 'test@example.com' })
    const { default: middleware } = await import('@/proxy')
    const request = makeRequest('/login')
    const response = await middleware(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/painel')
  })
})
