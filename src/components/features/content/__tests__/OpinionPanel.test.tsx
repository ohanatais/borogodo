import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OpinionPanel, type OpinionPanelProps } from '../OpinionPanel'

function makeProps(overrides: Partial<OpinionPanelProps> = {}): OpinionPanelProps {
  return {
    thesis: '',
    onThesisChange: vi.fn(),
    exampleText: '',
    onExampleTextChange: vi.fn(),
    onGenerate: vi.fn(),
    ...overrides,
  }
}

describe('OpinionPanel', () => {
  it('renderiza a textarea principal com label e placeholder das chaves i18n', () => {
    render(<OpinionPanel {...makeProps()} />)
    expect(screen.getByText('opinion.thesisLabel')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('opinion.thesisPlaceholder')).toBeInTheDocument()
  })

  it('chama onThesisChange ao digitar', () => {
    const onThesisChange = vi.fn()
    render(<OpinionPanel {...makeProps({ onThesisChange })} />)
    fireEvent.change(screen.getByPlaceholderText('opinion.thesisPlaceholder'), {
      target: { value: 'Retenção é confiança' },
    })
    expect(onThesisChange).toHaveBeenCalledWith('Retenção é confiança')
  })

  it('o exemplo começa fechado — mostra só o convite, não a textarea', () => {
    render(<OpinionPanel {...makeProps()} />)
    expect(screen.getByRole('button', { name: 'opinion.exampleInvite' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('opinion.examplePlaceholder')).not.toBeInTheDocument()
  })

  it('clicar no convite abre a textarea de exemplo', () => {
    render(<OpinionPanel {...makeProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'opinion.exampleInvite' }))
    expect(screen.getByPlaceholderText('opinion.examplePlaceholder')).toBeInTheDocument()
  })

  it('já começa com a textarea de exemplo aberta quando exampleText tem conteúdo', () => {
    render(<OpinionPanel {...makeProps({ exampleText: 'Conduzi a virada de retenção' })} />)
    expect(screen.getByPlaceholderText('opinion.examplePlaceholder')).toBeInTheDocument()
  })

  it('chama onExampleTextChange ao digitar no exemplo', () => {
    const onExampleTextChange = vi.fn()
    render(<OpinionPanel {...makeProps({ exampleText: 'x', onExampleTextChange })} />)
    fireEvent.change(screen.getByPlaceholderText('opinion.examplePlaceholder'), {
      target: { value: 'Conduzi a virada' },
    })
    expect(onExampleTextChange).toHaveBeenCalledWith('Conduzi a virada')
  })

  it('desabilita o botão Gerar quando o campo principal está vazio', () => {
    render(<OpinionPanel {...makeProps({ thesis: '   ' })} />)
    expect(screen.getByRole('button', { name: 'opinion.generateBtn' })).toBeDisabled()
  })

  it('habilita e dispara onGenerate quando há texto — sem exigir exemplo', () => {
    const onGenerate = vi.fn()
    render(<OpinionPanel {...makeProps({ thesis: 'Retenção é confiança', onGenerate })} />)
    const btn = screen.getByRole('button', { name: 'opinion.generateBtn' })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    expect(onGenerate).toHaveBeenCalled()
  })
})
