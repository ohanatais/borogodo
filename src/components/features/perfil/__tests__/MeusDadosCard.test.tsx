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

import { MeusDadosCard } from '../MeusDadosCard'

const MOCK_PROFILE: Profile = {
  id: 'user-1',
  name: 'Ohana Tais',
  email: 'ohana@example.com',
  avatar_url: null,
  linkedin_url: 'https://linkedin.com/in/ohana',
  github_url: null,
  current_title: null,
  area: null,
  onboarding_completed: true,
  created_at: '2026-06-14T00:00:00Z',
  terms_accepted_at: null,
  terms_version: null,
  marketing_consent: false,
}

describe('MeusDadosCard', () => {
  beforeEach(() => {
    mockUpdateProfile.mockReset()
  })

  it('renders name, email, linkedin and github fields', () => {
    render(<MeusDadosCard profile={MOCK_PROFILE} />)
    expect(screen.getByDisplayValue('Ohana Tais')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ohana@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://linkedin.com/in/ohana')).toBeInTheDocument()
    expect(screen.getByLabelText('github')).toBeInTheDocument()
  })

  it('renders exactly one save button', () => {
    render(<MeusDadosCard profile={MOCK_PROFILE} />)
    expect(screen.getAllByRole('button', { name: 'save' })).toHaveLength(1)
  })

  it('saves name, linkedin and github together in a single call', async () => {
    mockUpdateProfile.mockResolvedValue({})
    render(<MeusDadosCard profile={MOCK_PROFILE} />)
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Ohana T.' } })
    fireEvent.change(screen.getByLabelText('github'), { target: { value: 'github.com/ohana' } })
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledTimes(1)
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Ohana T.',
        linkedin_url: 'https://linkedin.com/in/ohana',
        github_url: 'https://github.com/ohana',
      })
    })
  })

  it('shows saved feedback on success', async () => {
    mockUpdateProfile.mockResolvedValue({})
    render(<MeusDadosCard profile={MOCK_PROFILE} />)
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
    await waitFor(() => expect(screen.getByText('saved')).toBeInTheDocument())
  })

  it('shows error feedback on failure', async () => {
    mockUpdateProfile.mockResolvedValue({ error: 'boom' })
    render(<MeusDadosCard profile={MOCK_PROFILE} />)
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
    await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument())
  })

  it('renders with null profile without crashing', () => {
    render(<MeusDadosCard profile={null} />)
    expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument()
  })
})
