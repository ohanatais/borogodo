import { describe, it, expect, vi } from 'vitest'
import { getProfile } from '../profiles'
import type { Profile } from '@/types/profile'

function makeSupabase(returnData: unknown, returnError: unknown = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: returnData, error: returnError }),
        }),
      }),
    }),
  }
}

const MOCK_PROFILE: Profile = {
  id: 'user-123',
  name: 'Ohana',
  email: 'ohana@example.com',
  avatar_url: null,
  linkedin_url: null,
  github_url: null,
  current_title: null,
  area: null,
  onboarding_completed: false,
  created_at: '2026-06-14T00:00:00Z',
  terms_accepted_at: null,
  terms_version: null,
  marketing_consent: false,
}

describe('getProfile', () => {
  it('returns profile when found', async () => {
    const supabase = makeSupabase(MOCK_PROFILE)
    const result = await getProfile(supabase as never, 'user-123')
    expect(result).toEqual(MOCK_PROFILE)
  })

  it('returns null when not found', async () => {
    const supabase = makeSupabase(null)
    const result = await getProfile(supabase as never, 'user-999')
    expect(result).toBeNull()
  })

  it('queries the profiles table with the correct user id', async () => {
    const supabase = makeSupabase(MOCK_PROFILE)
    await getProfile(supabase as never, 'user-123')
    expect(supabase.from).toHaveBeenCalledWith('profiles')
  })
})
