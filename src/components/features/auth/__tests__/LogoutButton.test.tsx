import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockSignOut = vi.hoisted(() => vi.fn())

vi.mock('@/lib/actions/auth', () => ({
  signOut: mockSignOut,
}))

import { LogoutButton } from '../LogoutButton'

describe('LogoutButton', () => {
  it('T023: calls signOut Server Action when clicked', () => {
    render(<LogoutButton />)
    // useTranslations mock returns key without namespace; t('logoutAriaLabel') → 'logoutAriaLabel'
    const button = screen.getByRole('button', { name: /logoutAriaLabel/i })
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('displays the logout label', () => {
    render(<LogoutButton />)
    // t('logout') → 'logout'
    expect(screen.getByText('logout')).toBeInTheDocument()
  })
})
