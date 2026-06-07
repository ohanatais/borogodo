import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GoogleButton } from '../GoogleButton'

const mockSignInWithOAuth = vi.fn()

vi.mock('@/lib/db/supabase/client', () => ({
  createBrowserClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}))

describe('GoogleButton', () => {
  beforeEach(() => {
    mockSignInWithOAuth.mockReset()
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })
  })

  it('renders with the Google label from i18n', () => {
    render(<GoogleButton />)
    expect(screen.getByRole('button')).toBeInTheDocument()
    // useTranslations mock returns the key without namespace; t('google') → 'google'
    expect(screen.getByText('google')).toBeInTheDocument()
  })

  it('calls signInWithOAuth with provider google and correct redirectTo', async () => {
    render(<GoogleButton />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        redirectTo: expect.stringContaining('/auth/callback'),
        queryParams: expect.objectContaining({
          access_type: 'offline',
          prompt: 'consent',
        }),
      }),
    })
  })

  it('has a touch target of at least 48px height', () => {
    const { container } = render(<GoogleButton />)
    const button = container.querySelector('button')
    expect(button).toHaveClass('min-h-12')
  })
})
