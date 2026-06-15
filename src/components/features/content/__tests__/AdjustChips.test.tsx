import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdjustChips } from '../AdjustChips'

describe('AdjustChips', () => {
  it('renderiza os três chips de ajuste', () => {
    render(<AdjustChips onAdjust={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'adjust.shorter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'adjust.lessFormal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'adjust.removeJargon' })).toBeInTheDocument()
  })

  it('chama onAdjust com o tipo do chip clicado', () => {
    const onAdjust = vi.fn()
    render(<AdjustChips onAdjust={onAdjust} />)
    fireEvent.click(screen.getByRole('button', { name: 'adjust.removeJargon' }))
    expect(onAdjust).toHaveBeenCalledWith('tira_jargao')
  })

  it('desabilita os chips enquanto uma geração está em curso', () => {
    render(<AdjustChips onAdjust={vi.fn()} disabled />)
    expect(screen.getByRole('button', { name: 'adjust.shorter' })).toBeDisabled()
  })
})
