import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DELETE } from '../route'

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function makeDeleteClient({
  userId,
  deleteError = null as unknown,
}: { userId: string | null; deleteError?: unknown }) {
  const deleteCalls: string[][] = []

  function makeBuilder(result: { data: unknown; error: unknown }) {
    const builder: Record<string, unknown> = {}
    const chain = ['eq', 'in'] as const
    for (const m of chain) {
      builder[m] = vi.fn((..._args: unknown[]) => builder)
    }
    builder.then = (resolve: (v: unknown) => unknown) => resolve(result)
    return builder
  }

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
      },
      from: vi.fn((table: string) => {
        if (table === 'entries') {
          const builder = makeBuilder({ data: null, error: deleteError })
          builder['eq'] = vi.fn((...args: unknown[]) => {
            deleteCalls.push(args as string[])
            return builder
          })
          builder['in'] = vi.fn((...args: unknown[]) => {
            deleteCalls.push(args as string[])
            return builder
          })
          return { delete: () => builder }
        }
        return makeBuilder({ data: null, error: null })
      }),
    },
    deleteCalls,
  }
}

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { createServerClient } from '@/lib/db/supabase/server'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DELETE /api/entries/batch', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when unauthenticated', async () => {
    const { client } = makeDeleteClient({ userId: null })
    vi.mocked(createServerClient).mockResolvedValue(client as never)
    const req = new Request('http://localhost/api/entries/batch', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['id1'] }),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when ids is missing or empty', async () => {
    const { client } = makeDeleteClient({ userId: 'u1' })
    vi.mocked(createServerClient).mockResolvedValue(client as never)

    for (const body of [{ ids: [] }, { ids: 'not-array' }, {}]) {
      const req = new Request('http://localhost/api/entries/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const res = await DELETE(req)
      expect(res.status).toBe(400)
    }
  })

  it('returns 400 when ids contains non-strings', async () => {
    const { client } = makeDeleteClient({ userId: 'u1' })
    vi.mocked(createServerClient).mockResolvedValue(client as never)
    const req = new Request('http://localhost/api/entries/batch', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [1, 2] }),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('deletes only the authenticated user entries (scoped by user_id)', async () => {
    const { client, deleteCalls } = makeDeleteClient({ userId: 'u1' })
    vi.mocked(createServerClient).mockResolvedValue(client as never)
    const req = new Request('http://localhost/api/entries/batch', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['id1', 'id2'] }),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    const hasUserScope = deleteCalls.some(
      (call) => call[0] === 'user_id' && call[1] === 'u1'
    )
    expect(hasUserScope).toBe(true)
  })

  it('returns 200 ok on success', async () => {
    const { client } = makeDeleteClient({ userId: 'u1' })
    vi.mocked(createServerClient).mockResolvedValue(client as never)
    const req = new Request('http://localhost/api/entries/batch', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['id1'] }),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
  })
})
