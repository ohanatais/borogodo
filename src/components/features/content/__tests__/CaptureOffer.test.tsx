import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CaptureOffer, type CaptureOfferProps } from '../CaptureOffer'

function makeProps(overrides: Partial<CaptureOfferProps> = {}): CaptureOfferProps {
  return {
    onAccept: vi.fn(),
    onDismiss: vi.fn(),
    ...overrides,
  }
}

describe('CaptureOffer', () => {
  it('renderiza a pergunta e o CTA de salvar', () => {
    render(<CaptureOffer {...makeProps()} />)
    expect(screen.getByText('captureOffer.question')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'captureOffer.save' })).toBeInTheDocument()
  })

  it('clicar em salvar chama onAccept', () => {
    const onAccept = vi.fn()
    render(<CaptureOffer {...makeProps({ onAccept })} />)
    fireEvent.click(screen.getByRole('button', { name: 'captureOffer.save' }))
    expect(onAccept).toHaveBeenCalled()
  })

  it('clicar em dispensar chama onDismiss', () => {
    const onDismiss = vi.fn()
    render(<CaptureOffer {...makeProps({ onDismiss })} />)
    fireEvent.click(screen.getByRole('button', { name: 'captureOffer.dismiss' }))
    expect(onDismiss).toHaveBeenCalled()
  })
})
