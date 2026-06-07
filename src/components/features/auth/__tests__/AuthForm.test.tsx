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
    fireEvent.click(screen.getByRole('button', { name: 'submit.signup' }))
    await waitFor(() => {
      expect(screen.getByText('confirm.title')).toBeInTheDocument()
    })
    expect(mockRouterPush).not.toHaveBeenCalled()
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
