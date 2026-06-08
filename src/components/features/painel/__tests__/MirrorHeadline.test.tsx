import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MirrorHeadline } from '../MirrorHeadline'

describe('MirrorHeadline', () => {
  it('renders the headline from the latest mirror snapshot and a link to /espelho', () => {
    render(
      <MirrorHeadline
        headline="Você transforma complexidade em clareza — e faz isso melhor do que percebe."
        status="active"
      />
    )

    expect(
      screen.getByText('Você transforma complexidade em clareza — e faz isso melhor do que percebe.')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /mirror\.link/ })).toHaveAttribute('href', '/espelho')
  })

  it('shows the chromatic status pill for the given status', () => {
    render(<MirrorHeadline headline="Algo" status="building" />)
    expect(screen.getByText('status.building')).toBeInTheDocument()
  })

  it('renders the fallback message when there is no mirror snapshot yet', () => {
    render(<MirrorHeadline headline={null} status="building" />)
    expect(screen.getByText('mirror.fallback')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /mirror\.link/ })).not.toBeInTheDocument()
  })
})
