import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Profile } from '@/types/profile'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}))

const mockUpdateProfile = vi.hoisted(() => vi.fn())

vi.mock('@/lib/actions/profile', () => ({
  updateProfileAction: mockUpdateProfile,
  uploadAvatarAction: vi.fn().mockResolvedValue({}),
}))

import { IdentityCard } from '../IdentityCard'

const MOCK_PROFILE: Profile = {
  id: 'user-1',
  name: 'Ohana Tais',
  email: 'ohana@example.com',
  avatar_url: null,
  linkedin_url: null,
  github_url: null,
  current_title: null,
  area: null,
  onboarding_completed: true,
  created_at: '2026-06-14T00:00:00Z',
}

describe('IdentityCard', () => {
  beforeEach(() => {
    mockUpdateProfile.mockReset()
  })

  it('renders name and email fields', () => {
    render(<IdentityCard profile={MOCK_PROFILE} />)
    expect(screen.getByDisplayValue('Ohana Tais')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ohana@example.com')).toBeInTheDocument()
  })

  it('email field is read-only', () => {
    render(<IdentityCard profile={MOCK_PROFILE} />)
    const emailInput = screen.getByDisplayValue('ohana@example.com')
    expect(emailInput).toHaveAttribute('readonly')
  })

  it('calls updateProfileAction on save', async () => {
    mockUpdateProfile.mockResolvedValue({})
    render(<IdentityCard profile={MOCK_PROFILE} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledWith({ name: 'Ohana Tais' }))
  })

  it('shows saved feedback on success', async () => {
    mockUpdateProfile.mockResolvedValue({})
    render(<IdentityCard profile={MOCK_PROFILE} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText('saved')).toBeInTheDocument())
  })

  it('shows error feedback on failure', async () => {
    mockUpdateProfile.mockResolvedValue({ error: 'Erro ao salvar. Tente de novo.' })
    render(<IdentityCard profile={MOCK_PROFILE} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText(/Erro ao salvar/i)).toBeInTheDocument())
  })

  it('renders with null profile without crashing', () => {
    render(<IdentityCard profile={null} />)
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })
})
