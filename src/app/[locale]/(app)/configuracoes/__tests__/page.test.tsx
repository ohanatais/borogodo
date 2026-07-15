import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({ refresh: vi.fn(), push: vi.fn() })),
  usePathname: vi.fn(() => '/configuracoes'),
}))

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'u1', email: 'ana@example.com' } } })),
    },
  })),
}))

vi.mock('@/lib/db/profiles', () => ({
  getProfile: vi.fn(async () => ({
    id: 'u1',
    name: 'Ana',
    email: 'ana@example.com',
    avatar_url: null,
    linkedin_url: null,
    github_url: null,
    current_title: null,
    area: null,
    onboarding_completed: true,
    created_at: '2026-01-01T00:00:00.000Z',
    terms_accepted_at: '2026-07-01T00:00:00.000Z',
    terms_version: '2026-07',
    marketing_consent: false,
  })),
}))

import { fireEvent } from '@testing-library/react'
import ConfiguracoesPage from '../page'

describe('ConfiguracoesPage — abas (024)', () => {
  it('renders the three tabs and shows "meus dados" by default', async () => {
    const jsx = await ConfiguracoesPage()
    render(jsx)

    expect(screen.getByRole('button', { name: 'sections.profile' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'sections.privacy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'sections.support' })).toBeInTheDocument()

    // painel "meus dados" (identidade) visível por padrão
    expect(screen.getByDisplayValue('Ana')).toBeInTheDocument()
    // painel "suporte" não deve estar montado
    expect(screen.queryByText('heading')).not.toBeInTheDocument()
  })

  it('switches to the privacy tab and shows the legal card', async () => {
    const jsx = await ConfiguracoesPage()
    render(jsx)

    fireEvent.click(screen.getByRole('button', { name: 'sections.privacy' }))

    expect(screen.getByRole('link', { name: 'termsLabel' })).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Ana')).not.toBeInTheDocument()
  })
})
