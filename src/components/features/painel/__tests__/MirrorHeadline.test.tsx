import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MirrorHeadline } from '../MirrorHeadline'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn(), push: vi.fn() })),
  usePathname: vi.fn(() => '/painel'),
}))

describe('MirrorHeadline', () => {
  it('renders the headline from the latest mirror snapshot with a link to /espelho', () => {
    render(
      <MirrorHeadline
        headline="Você transforma complexidade em clareza — e faz isso melhor do que percebe."
        status="active"
        entryCount={10}
      />
    )

    expect(
      screen.getByText('Você transforma complexidade em clareza — e faz isso melhor do que percebe.')
    ).toBeInTheDocument()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/espelho')
  })

  it('shows the chromatic status pill for the given status', () => {
    render(<MirrorHeadline headline="Algo" status="building" entryCount={5} />)
    expect(screen.getByText('status.building')).toBeInTheDocument()
  })

  it('renders the fallback message when there is no mirror snapshot and fewer than 3 entries', () => {
    render(<MirrorHeadline headline={null} status="building" entryCount={2} />)
    expect(screen.getByText('mirror.fallback')).toBeInTheDocument()
  })

  it('renders the ready message and generate button when no mirror but enough entries', () => {
    render(<MirrorHeadline headline={null} status="active" entryCount={5} />)
    expect(screen.getByText('mirror.ready')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gerar espelho agora/ })).toBeInTheDocument()
  })
})
