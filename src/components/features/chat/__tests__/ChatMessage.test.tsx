import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatMessage } from '../ChatMessage'

describe('ChatMessage feedback', () => {
  it('apresenta títulos e separadores de markdown sem expor a sintaxe crua', () => {
    render(
      <ChatMessage
        message={{
          id: 'assistant-markdown',
          role: 'assistant',
          content: '## Leitura de aderência\n\n---\n\n**Evidências fortes**\n\n1. História principal',
        }}
        onSuggestionClick={vi.fn()}
      />
    )

    expect(screen.getByText('Leitura de aderência')).toBeInTheDocument()
    expect(screen.getByText('Evidências fortes')).toBeInTheDocument()
    expect(screen.getByText('História principal')).toBeInTheDocument()
    expect(screen.queryByText('---')).not.toBeInTheDocument()
    expect(screen.queryByText(/## Leitura/)).not.toBeInTheDocument()
  })

  it('abre um campo contextual ao avaliar negativamente e envia o motivo', () => {
    const onHelpful = vi.fn()

    render(
      <ChatMessage
        message={{ id: 'assistant-1', role: 'assistant', content: 'Uma resposta que precisa de ajustes.' }}
        onSuggestionClick={vi.fn()}
        onHelpful={onHelpful}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Não útil' }))

    expect(onHelpful).toHaveBeenCalledWith(false)
    const field = screen.getByLabelText('O que faltou nesta resposta?')
    expect(field).toBeInTheDocument()

    fireEvent.change(field, { target: { value: 'Ficou genérica e não usou minha experiência mais recente.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar feedback' }))

    expect(onHelpful).toHaveBeenLastCalledWith(
      false,
      'Ficou genérica e não usou minha experiência mais recente.'
    )
    expect(screen.queryByLabelText('O que faltou nesta resposta?')).not.toBeInTheDocument()
    expect(screen.getByText('Feedback enviado')).toBeInTheDocument()
  })

  it('fecha o campo sem enviar texto ao cancelar', () => {
    const onHelpful = vi.fn()

    render(
      <ChatMessage
        message={{ id: 'assistant-2', role: 'assistant', content: 'Outra resposta.' }}
        onSuggestionClick={vi.fn()}
        onHelpful={onHelpful}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Não útil' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onHelpful).toHaveBeenCalledTimes(1)
    expect(screen.queryByLabelText('O que faltou nesta resposta?')).not.toBeInTheDocument()
  })
})
