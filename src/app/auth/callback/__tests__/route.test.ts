import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockExchangeCodeForSession = vi.fn()

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}))

describe('/auth/callback route handler', () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockReset()
  })

  it('T014: exchanges code for session and redirects to /painel on success', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ data: {}, error: null })
    const { GET } = await import('../route')
    const request = new Request('http://localhost/auth/callback?code=test-code')
    const response = await GET(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/painel')
  })

  it('redirects to /login?error=auth when no code is present', async () => {
    const { GET } = await import('../route')
    const request = new Request('http://localhost/auth/callback')
    const response = await GET(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login?error=auth')
  })

  it('redirects to /login?error=auth when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: null,
      error: { message: 'invalid code' },
    })
    const { GET } = await import('../route')
    const request = new Request('http://localhost/auth/callback?code=bad-code')
    const response = await GET(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login?error=auth')
  })
})
