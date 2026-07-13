import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSignUp = vi.hoisted(() => vi.fn())
const mockSignInWithPassword = vi.hoisted(() => vi.fn())
const mockRouterPush = vi.hoisted(() => vi.fn())
const mockRouterReplace = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db/supabase/client', () => ({
  createBrowserClient: () => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
  }),
}))

import { AuthForm } from '../AuthForm'

// The useTranslations mock (from test/setup.ts) returns (key) => key.
// So t('field.name') → 'field.name', t('submit.signup') → 'submit.signup', etc.

describe('AuthForm — signup mode', () => {
  beforeEach(() => {
    mockSignUp.mockReset()
    mockSignInWithPassword.mockReset()
    mockRouterPush.mockReset()
    mockRouterReplace.mockReset()
  })

  it('T033: renders Nome, E-mail and Senha fields in signup mode', () => {
    render(<AuthForm initialMode="signup" />)
    expect(screen.getByLabelText('field.name')).toBeInTheDocument()
    expect(screen.getByLabelText('field.email')).toBeInTheDocument()
    expect(screen.getByLabelText('field.password')).toBeInTheDocument()
  })

  it('T033: validates name is required before submitting', async () => {
    render(<AuthForm initialMode="signup" />)
    // Fill email and password so only the name error triggers
    fireEvent.change(screen.getByLabelText('field.email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText('field.password'), {
      target: { value: 'senha12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'submit.signup' }))
    await waitFor(() => {
      expect(screen.getByText('error.nameRequired')).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('T033: validates password minimum length before submitting', async () => {
    render(<AuthForm initialMode="signup" />)
    fireEvent.change(screen.getByLabelText('field.name'), {
      target: { value: 'Ana' },
    })
    fireEvent.change(screen.getByLabelText('field.email'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.change(screen.getByLabelText('field.password'), {
      target: { value: '123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'submit.signup' }))
    await waitFor(() => {
      expect(screen.getByText('error.passwordTooShort')).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('T034: shows emailTaken error when email already exists', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered', status: 400 },
    })
    render(<AuthForm initialMode="signup" />)
    fireEvent.change(screen.getByLabelText('field.name'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('field.email'), {
      target: { value: 'existing@example.com' },
    })
    fireEvent.change(screen.getByLabelText('field.password'), {
      target: { value: 'senha12345' },
    })
    fireEvent.change(screen.getByLabelText('field.confirmPassword'), {
      target: { value: 'senha12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'submit.signup' }))
    await waitFor(() => {
      expect(screen.getByText('error.emailTaken')).toBeInTheDocument()
    })
  })

  it('T035: shows confirmation screen after successful signup', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: '1' } },
      error: null,
    })
    render(<AuthForm initialMode="signup" />)
    fireEvent.change(screen.getByLabelText('field.name'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('field.email'), {
      target: { value: 'new@example.com' },
    })
    fireEvent.change(screen.getByLabelText('field.password'), {
      target: { value: 'senha12345' },
    })
    fireEvent.change(screen.getByLabelText('field.confirmPassword'), {
      target: { value: 'senha12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'submit.signup' }))
    await waitFor(() => {
      expect(screen.getByText('confirm.title')).toBeInTheDocument()
    })
    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})

describe('AuthForm — legal consent (024)', () => {
  beforeEach(() => {
    mockSignUp.mockReset()
    mockSignInWithPassword.mockReset()
    mockRouterPush.mockReset()
    mockRouterReplace.mockReset()
  })

  it('T019: signup mode shows the sign-in-wrap notice with links to the legal pages', () => {
    render(<AuthForm initialMode="signup" />)
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/termos-de-uso')
    expect(hrefs).toContain('/politica-de-privacidade')
  })

  it('024: opens the sign-in-wrap legal links in a new tab (does not lose the signup form)', () => {
    render(<AuthForm initialMode="signup" />)
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank')
    }
  })

  it('T019: signup mode does not render a terms checkbox', () => {
    render(<AuthForm initialMode="signup" />)
    expect(screen.queryByRole('checkbox', { name: /termo/i })).not.toBeInTheDocument()
  })

  it('T019: login mode does not show the sign-in-wrap notice', () => {
    render(<AuthForm initialMode="login" />)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  it('T031: signup mode shows an unchecked marketing opt-in checkbox', () => {
    render(<AuthForm initialMode="signup" />)
    const checkbox = screen.getByRole('checkbox', { name: 'marketingOptIn.label' })
    expect(checkbox).not.toBeChecked()
  })

  it('T021/T032: sends the marketing checkbox value as signup metadata', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: '1' } }, error: null })
    render(<AuthForm initialMode="signup" />)
    fireEvent.change(screen.getByLabelText('field.name'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('field.email'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.change(screen.getByLabelText('field.password'), {
      target: { value: 'senha12345' },
    })
    fireEvent.change(screen.getByLabelText('field.confirmPassword'), {
      target: { value: 'senha12345' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: 'marketingOptIn.label' }))
    fireEvent.click(screen.getByRole('button', { name: 'submit.signup' }))
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: expect.objectContaining({ marketing_consent: true }),
          }),
        })
      )
    })
  })
})

describe('AuthForm — login mode', () => {
  beforeEach(() => {
    mockSignUp.mockReset()
    mockSignInWithPassword.mockReset()
    mockRouterPush.mockReset()
    mockRouterReplace.mockReset()
  })

  it('T039: submits login and pushes to /painel on success', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: '1' }, session: {} },
      error: null,
    })
    render(<AuthForm initialMode="login" />)
    fireEvent.change(screen.getByLabelText('field.email'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText('field.password'), {
      target: { value: 'senha12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'submit.login' }))
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/painel')
    })
  })

  it('T040: shows wrongPassword error on auth failure', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials', status: 400 },
    })
    render(<AuthForm initialMode="login" />)
    fireEvent.change(screen.getByLabelText('field.email'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText('field.password'), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'submit.login' }))
    await waitFor(() => {
      expect(screen.getByText('error.wrongPassword')).toBeInTheDocument()
    })
  })

  it('T040: shows emailNotConfirmed error when email is not confirmed', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email not confirmed', status: 400 },
    })
    render(<AuthForm initialMode="login" />)
    fireEvent.change(screen.getByLabelText('field.email'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText('field.password'), {
      target: { value: 'senha12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'submit.login' }))
    await waitFor(() => {
      expect(screen.getByText('error.emailNotConfirmed')).toBeInTheDocument()
    })
  })
})
