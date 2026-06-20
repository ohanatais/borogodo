import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UsarInvite } from '../UsarInvite'

describe('UsarInvite', () => {
  it('mostra os dois gatilhos com frase de ação + exemplos', () => {
    render(<UsarInvite />)
    expect(screen.getByText('hubs.mostrar.title')).toBeInTheDocument()
    expect(screen.getByText('hubs.mostrar.examples')).toBeInTheDocument()
    expect(screen.getByText('hubs.preparar.title')).toBeInTheDocument()
    expect(screen.getByText('hubs.preparar.examples')).toBeInTheDocument()
  })

  it('cada gatilho leva ao Repertório na seção correspondente', () => {
    render(<UsarInvite />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/presenca#mostrar')
    expect(hrefs).toContain('/presenca#preparar')
  })
})
