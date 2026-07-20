import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormattedAiText, plainAiText, splitAiTextTitle } from '../FormattedAiText'

describe('FormattedAiText', () => {
  const legacyAnswer = '## Leitura de aderência\n\n---\n\n**Evidências fortes**\n\n1. História principal'

  it('apresenta respostas antigas sem expor a sintaxe de markdown', () => {
    render(<FormattedAiText content={legacyAnswer} />)

    expect(screen.getByText('Leitura de aderência')).toBeInTheDocument()
    expect(screen.getByText('Evidências fortes')).toBeInTheDocument()
    expect(screen.getByText('História principal')).toBeInTheDocument()
    expect(screen.queryByText('---')).not.toBeInTheDocument()
    expect(screen.queryByText(/## Leitura/)).not.toBeInTheDocument()
  })

  it('separa o título para evitar repeti-lo no detalhe salvo', () => {
    expect(splitAiTextTitle(legacyAnswer)).toEqual({
      title: 'Leitura de aderência',
      body: '---\n\n**Evidências fortes**\n\n1. História principal',
    })
  })

  it('gera uma prévia limpa', () => {
    expect(plainAiText(legacyAnswer)).toBe('Leitura de aderência\n\nEvidências fortes\n\n1. História principal')
  })
})
