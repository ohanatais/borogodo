import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}))

const mockGetActivityData = vi.fn()
vi.mock('@/lib/feed/getActivityData', () => ({
  getActivityData: (...args: unknown[]) => mockGetActivityData(...args),
}))

vi.mock('@/lib/log', () => ({ logger: { error: vi.fn(), info: vi.fn() } }))

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/feed/activity')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return new Request(url.toString())
}

describe('GET /api/feed/activity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetActivityData.mockResolvedValue([{ date: '2025-01-01', count: 3 }])
  })

  it('devolve 401 quando não há sessão', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { GET } = await import('../route')
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('devolve 200 com ActivityCell[]', async () => {
    const { GET } = await import('../route')
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = (await res.json()) as unknown[]
    expect(Array.isArray(body)).toBe(true)
    expect(body[0]).toHaveProperty('date')
    expect(body[0]).toHaveProperty('count')
  })

  it('devolve 400 quando window é 0 (fora do range 1–730)', async () => {
    const { GET } = await import('../route')
    const res = await GET(makeRequest({ window: '0' }))
    expect(res.status).toBe(400)
  })

  it('devolve 400 quando window é 731 (fora do range 1–730)', async () => {
    const { GET } = await import('../route')
    const res = await GET(makeRequest({ window: '731' }))
    expect(res.status).toBe(400)
  })

  it('usa window=365 como default', async () => {
    const { GET } = await import('../route')
    await GET(makeRequest())
    expect(mockGetActivityData).toHaveBeenCalledWith(expect.anything(), 'user-1', 365)
  })
})
