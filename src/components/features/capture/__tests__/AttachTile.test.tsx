import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AttachTile } from '../AttachTile'

// Revisão manual (Registros): imagens anexadas não tinham como ser vistas em tela cheia.
describe('AttachTile — imagem clicável abre em tela cheia (revisão manual)', () => {
  it('clicar na miniatura abre um diálogo com a imagem ampliada', () => {
    render(<AttachTile kind="image" previewUrl="https://example.com/foto.png" />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'attach.viewFullAriaLabel' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('clicar no X ou fora da imagem fecha a tela cheia', () => {
    render(<AttachTile kind="image" previewUrl="https://example.com/foto.png" />)

    fireEvent.click(screen.getByRole('button', { name: 'attach.viewFullAriaLabel' }))
    fireEvent.click(screen.getByRole('button', { name: 'attach.closeFullAriaLabel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('link não ganha comportamento de tela cheia', () => {
    render(<AttachTile kind="link" previewUrl="https://example.com" />)

    expect(screen.queryByRole('button', { name: 'attach.viewFullAriaLabel' })).not.toBeInTheDocument()
  })
})
