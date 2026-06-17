import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OpinionPanel, type OpinionPanelProps } from '../OpinionPanel'

const ENTRIES: OpinionPanelProps['entries'] = [
  { ref: 'entry-1', label: 'Liderou retenção numa fintech' },
  { ref: 'entry-2', label: 'Reviews 5 estrelas no Clutch' },
]

function makeProps(overrides: Partial<OpinionPanelProps> = {}): OpinionPanelProps {
  return {
    thesis: '',
    onThesisChange: vi.fn(),
    lastroMode: null,
    onLastroModeChange: vi.fn(),
    entries: ENTRIES,
    selectedEntryRef: null,
    onSelectEntry: vi.fn(),
    lastroText: '',
    onLastroTextChange: vi.fn(),
    onGenerate: vi.fn(),
    error: null,
    ...overrides,
  }
}

describe('OpinionPanel', () => {
  it('renderiza a textarea de tese com label e placeholder das chaves i18n', () => {
    render(<OpinionPanel {...makeProps()} />)
    expect(screen.getByText('opinion.thesisLabel')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('opinion.thesisPlaceholder')).toBeInTheDocument()
  })

  it('chama onThesisChange ao digitar na tese', () => {
    const onThesisChange = vi.fn()
    render(<OpinionPanel {...makeProps({ onThesisChange })} />)
    fireEvent.change(screen.getByPlaceholderText('opinion.thesisPlaceholder'), {
      target: { value: 'Retenção é confiança' },
    })
    expect(onThesisChange).toHaveBeenCalledWith('Retenção é confiança')
  })

  it('renderiza o seletor de lastro com as duas opções', () => {
    render(<OpinionPanel {...makeProps()} />)
    expect(screen.getByRole('button', { name: 'opinion.fromEntry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'opinion.writeNow' })).toBeInTheDocument()
  })

  it('clicar "Usar entrada registrada" chama onLastroModeChange com "entry"', () => {
    const onLastroModeChange = vi.fn()
    render(<OpinionPanel {...makeProps({ onLastroModeChange })} />)
    fireEvent.click(screen.getByRole('button', { name: 'opinion.fromEntry' }))
    expect(onLastroModeChange).toHaveBeenCalledWith('entry')
  })

  it('clicar "Escrever agora" chama onLastroModeChange com "writeNow"', () => {
    const onLastroModeChange = vi.fn()
    render(<OpinionPanel {...makeProps({ onLastroModeChange })} />)
    fireEvent.click(screen.getByRole('button', { name: 'opinion.writeNow' }))
    expect(onLastroModeChange).toHaveBeenCalledWith('writeNow')
  })

  it('no modo "writeNow" mostra a textarea de vivência', () => {
    render(<OpinionPanel {...makeProps({ lastroMode: 'writeNow' })} />)
    expect(screen.getByPlaceholderText('opinion.writeNowPlaceholder')).toBeInTheDocument()
  })

  it('fora do modo "writeNow" não mostra a textarea de vivência', () => {
    render(<OpinionPanel {...makeProps({ lastroMode: null })} />)
    expect(screen.queryByPlaceholderText('opinion.writeNowPlaceholder')).not.toBeInTheDocument()
  })

  it('no modo "entry" lista as entradas disponíveis', () => {
    render(<OpinionPanel {...makeProps({ lastroMode: 'entry' })} />)
    expect(screen.getByText('Liderou retenção numa fintech')).toBeInTheDocument()
    expect(screen.getByText('Reviews 5 estrelas no Clutch')).toBeInTheDocument()
  })

  it('desabilita o botão Gerar quando a tese está vazia', () => {
    render(<OpinionPanel {...makeProps({ thesis: '   ' })} />)
    expect(screen.getByRole('button', { name: 'opinion.generateBtn' })).toBeDisabled()
  })

  it('habilita e dispara onGenerate quando a tese está preenchida', () => {
    const onGenerate = vi.fn()
    render(<OpinionPanel {...makeProps({ thesis: 'Retenção é confiança', onGenerate })} />)
    const btn = screen.getByRole('button', { name: 'opinion.generateBtn' })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    expect(onGenerate).toHaveBeenCalled()
  })

  it('exibe a mensagem de erro de lastro quando error é opinion_needs_lastro', () => {
    render(<OpinionPanel {...makeProps({ error: 'opinion_needs_lastro' })} />)
    expect(screen.getByText('opinion.needsLastroError')).toBeInTheDocument()
  })
})
