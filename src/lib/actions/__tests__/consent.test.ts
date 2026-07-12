import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createServerClient } from '@/lib/db/supabase/server'
import { recordTermsAcceptance, setMarketingConsent } from '../consent'

function makeClient({
  userId,
  currentTermsVersion = null as string | null,
  updateError = null as unknown,
}: {
  userId: string | null
  currentTermsVersion?: string | null
  updateError?: unknown
}) {
  const updateCalls: Record<string, unknown>[] = []

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
    },
    from: vi.fn((table: string) => {
      if (table !== 'profiles') throw new Error(`unexpected table: ${table}`)
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { terms_version: currentTermsVersion },
              error: null,
            }),
          })),
        })),
        update: vi.fn((payload: Record<string, unknown>) => {
          updateCalls.push(payload)
          return {
            eq: vi.fn().mockResolvedValue({ error: updateError }),
          }
        }),
      }
    }),
    __updateCalls: updateCalls,
  }
}

describe('recordTermsAcceptance', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requires auth', async () => {
    const client = makeClient({ userId: null })
    vi.mocked(createServerClient).mockResolvedValue(client as never)

    const result = await recordTermsAcceptance()

    expect(result.success).toBe(false)
  })

  it('records terms_version and terms_accepted_at when out of date', async () => {
    const client = makeClient({ userId: 'u1', currentTermsVersion: 'versão-antiga' })
    vi.mocked(createServerClient).mockResolvedValue(client as never)

    const result = await recordTermsAcceptance()

    expect(result.success).toBe(true)
    expect(client.__updateCalls).toHaveLength(1)
    expect(client.__updateCalls[0]).toMatchObject({ terms_version: expect.any(String) })
    expect(client.__updateCalls[0].terms_accepted_at).toBeTruthy()
  })

  it('is idempotent when already on the current version (no overwrite)', async () => {
    const client = makeClient({ userId: 'u1', currentTermsVersion: '2026-07' })
    vi.mocked(createServerClient).mockResolvedValue(client as never)

    const result = await recordTermsAcceptance()

    expect(result.success).toBe(true)
    expect(client.__updateCalls).toHaveLength(0)
  })
})

describe('setMarketingConsent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requires auth', async () => {
    const client = makeClient({ userId: null })
    vi.mocked(createServerClient).mockResolvedValue(client as never)

    const result = await setMarketingConsent(true)

    expect(result.success).toBe(false)
  })

  it('persists true', async () => {
    const client = makeClient({ userId: 'u1' })
    vi.mocked(createServerClient).mockResolvedValue(client as never)

    const result = await setMarketingConsent(true)

    expect(result.success).toBe(true)
    expect(client.__updateCalls).toEqual([{ marketing_consent: true }])
  })

  it('persists false', async () => {
    const client = makeClient({ userId: 'u1' })
    vi.mocked(createServerClient).mockResolvedValue(client as never)

    const result = await setMarketingConsent(false)

    expect(result.success).toBe(true)
    expect(client.__updateCalls).toEqual([{ marketing_consent: false }])
  })
})
