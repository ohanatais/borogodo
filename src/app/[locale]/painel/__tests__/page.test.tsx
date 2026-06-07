import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string, params?: Record<string, string>) => {
    if (params) return `${key}:${JSON.stringify(params)}`
    return key
  }),
}))

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
        },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: { id: 'user-1', name: 'Ana Silva' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/components/features/auth/LogoutButton', () => ({
  LogoutButton: () => <button>Sair</button>,
}))

describe('PainelPage', () => {
  it('T022: renders greeting with user name and LogoutButton', async () => {
    const { default: PainelPage } = await import('../page')
    const jsx = await PainelPage()
    render(jsx)
    expect(screen.getByText(/greeting/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
  })
})
