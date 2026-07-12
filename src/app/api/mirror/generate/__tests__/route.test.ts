import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.hoisted(() => vi.fn())
const mockUpdate = vi.hoisted(() => vi.fn())
const mockEq = vi.hoisted(() => vi.fn())
const mockGenerateAndSaveMirror = vi.hoisted(() => vi.fn())
const mockRecordTermsAcceptance = vi.hoisted(() => vi.fn())
const mockSetMarketingConsent = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      update: mockUpdate.mockReturnValue({ eq: mockEq }),
    })),
  })),
}))

vi.mock('@/lib/ai/mirror/generateMirror', () => ({
  generateAndSaveMirror: mockGenerateAndSaveMirror,
}))

vi.mock('@/lib/ai/cost/limitResponse', () => ({
  aiLimitResponse: vi.fn(() => null),
}))

vi.mock('@/lib/actions/consent', () => ({
  recordTermsAcceptance: mockRecordTermsAcceptance,
  setMarketingConsent: mockSetMarketingConsent,
}))

vi.mock('@/lib/log', () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}))

import { POST } from '../route'

describe('POST /api/mirror/generate — 024/T022 carimbo de aceite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEq.mockResolvedValue({ error: null })
    mockGenerateAndSaveMirror.mockResolvedValue({ mirror: { id: 'm1' } })
    mockRecordTermsAcceptance.mockResolvedValue({ success: true })
    mockSetMarketingConsent.mockResolvedValue({ success: true })
  })

  it('calls recordTermsAcceptance when onboarding completes for a user without marketing metadata', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', user_metadata: {} } } })

    await POST()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockRecordTermsAcceptance).toHaveBeenCalledTimes(1)
  })

  it('persists marketing_consent from signup metadata silently via setMarketingConsent', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { marketing_consent: true } } },
    })

    await POST()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockSetMarketingConsent).toHaveBeenCalledWith(true)
  })

  it('does not call setMarketingConsent when signup metadata has no marketing_consent (e.g. Google)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', user_metadata: {} } } })

    await POST()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockSetMarketingConsent).not.toHaveBeenCalled()
  })
})
