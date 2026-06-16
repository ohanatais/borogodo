import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}))

const mockGetFeedData = vi.fn()
vi.mock('@/lib/feed/getFeedData', () => ({
  getFeedData: (...args: unknown[]) => mockGetFeedData(...args),
}))

vi.mock('@/lib/log', () => ({ logger: { error: vi.fn(), info: vi.fn() } }))

const VALID_FEED_PAGE = {
  items: [],
  nextCursor: null,
  total: null,
}

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/feed')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return new Request(url.toString())
}

describe('GET /api/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetFeedData.mockResolvedValue(VALID_FEED_PAGE)
  })

  it('devolve 401 quando não há sessão', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { GET } = await import('../route')
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('devolve 200 com shape correto de FeedPage', async () => {
    const { GET } = await import('../route')
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = (await res.json()) as typeof VALID_FEED_PAGE
    expect(body).toHaveProperty('items')
    expect(body).toHaveProperty('nextCursor')
    expect(body).toHaveProperty('total')
    expect(Array.isArray(body.items)).toBe(true)
  })

  it('devolve 400 com axis inválido', async () => {
    const { GET } = await import('../route')
    const res = await GET(makeRequest({ axis: 'invalid_axis' }))
    expect(res.status).toBe(400)
  })

  it('aceita axis created_at e chama getFeedData', async () => {
    const { GET } = await import('../route')
    await GET(makeRequest({ axis: 'created_at' }))
    expect(mockGetFeedData).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      expect.objectContaining({ axis: 'created_at' })
    )
  })

  it('aceita axis entry_date e chama getFeedData', async () => {
    const { GET } = await import('../route')
    await GET(makeRequest({ axis: 'entry_date' }))
    expect(mockGetFeedData).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      expect.objectContaining({ axis: 'entry_date' })
    )
  })
})
