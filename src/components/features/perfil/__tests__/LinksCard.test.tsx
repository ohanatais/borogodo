import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Profile } from '@/types/profile'

const mockUpdateProfile = vi.hoisted(() => vi.fn())

vi.mock('@/lib/actions/profile', () => ({
  updateProfileAction: mockUpdateProfile,
  uploadAvatarAction: vi.fn().mockResolvedValue({}),
}))

import { LinksCard } from '../LinksCard'

const MOCK_PROFILE: Profile = {
  id: 'user-1',
  name: 'Ohana',
  email: 'ohana@example.com',
  avatar_url: null,
  linkedin_url: 'https://linkedin.com/in/ohana',
  github_url: null,
  current_title: null,
  area: null,
  onboarding_completed: true,
  created_at: '2026-06-14T00:00:00Z',
}

describe('LinksCard', () => {
  beforeEach(() => {
    mockUpdateProfile.mockReset()
  })

  it('renders with existing linkedin url', () => {
    render(<LinksCard profile={MOCK_PROFILE} />)
    expect(screen.getByDisplayValue('https://linkedin.com/in/ohana')).toBeInTheDocument()
  })

  it('calls updateProfileAction on save', async () => {
    mockUpdateProfile.mockResolvedValue({})
    render(<LinksCard profile={MOCK_PROFILE} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalled())
  })

  it('shows saved feedback on success', async () => {
    mockUpdateProfile.mockResolvedValue({})
    render(<LinksCard profile={MOCK_PROFILE} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText('saved')).toBeInTheDocument())
  })

  it('shows error on save failure', async () => {
    mockUpdateProfile.mockResolvedValue({ error: 'Erro ao salvar. Tente de novo.' })
    render(<LinksCard profile={MOCK_PROFILE} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText(/Erro ao salvar/i)).toBeInTheDocument())
  })

  it('renders with null profile without crashing', () => {
    render(<LinksCard profile={null} />)
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })
})
