import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ConfiguracoesTabs } from '../ConfiguracoesTabs'

describe('ConfiguracoesTabs', () => {
  it('shows the "meus dados" panel by default', () => {
    render(
      <ConfiguracoesTabs
        meusDadosLabel="Meus dados"
        privacidadeLabel="Privacidade"
        suporteLabel="Suporte"
        meusDados={<p>conteúdo de dados</p>}
        privacidade={<p>conteúdo de privacidade</p>}
        suporte={<p>conteúdo de suporte</p>}
      />
    )
    expect(screen.getByText('conteúdo de dados')).toBeInTheDocument()
    expect(screen.queryByText('conteúdo de privacidade')).not.toBeInTheDocument()
    expect(screen.queryByText('conteúdo de suporte')).not.toBeInTheDocument()
  })

  it('renders the three tab buttons', () => {
    render(
      <ConfiguracoesTabs
        meusDadosLabel="Meus dados"
        privacidadeLabel="Privacidade"
        suporteLabel="Suporte"
        meusDados={<p>a</p>}
        privacidade={<p>b</p>}
        suporte={<p>c</p>}
      />
    )
    expect(screen.getByRole('button', { name: 'Meus dados' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Privacidade' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Suporte' })).toBeInTheDocument()
  })

  it('switches to the "privacidade" panel when its tab is clicked', () => {
    render(
      <ConfiguracoesTabs
        meusDadosLabel="Meus dados"
        privacidadeLabel="Privacidade"
        suporteLabel="Suporte"
        meusDados={<p>conteúdo de dados</p>}
        privacidade={<p>conteúdo de privacidade</p>}
        suporte={<p>conteúdo de suporte</p>}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Privacidade' }))
    expect(screen.getByText('conteúdo de privacidade')).toBeInTheDocument()
    expect(screen.queryByText('conteúdo de dados')).not.toBeInTheDocument()
  })

  it('switches to the "suporte" panel when its tab is clicked', () => {
    render(
      <ConfiguracoesTabs
        meusDadosLabel="Meus dados"
        privacidadeLabel="Privacidade"
        suporteLabel="Suporte"
        meusDados={<p>conteúdo de dados</p>}
        privacidade={<p>conteúdo de privacidade</p>}
        suporte={<p>conteúdo de suporte</p>}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Suporte' }))
    expect(screen.getByText('conteúdo de suporte')).toBeInTheDocument()
  })
})
