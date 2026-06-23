import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { CopyButton } from '../CopyButton'

const LABELS = {
  value: 'admin@borogodo.ai',
  copyLabel: 'Copiar e-mail',
  copiedLabel: 'Copiado!',
  failedLabel: 'Não consegui copiar.',
}

describe('CopyButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the copy label by default', () => {
    render(<CopyButton {...LABELS} />)
    expect(screen.getByRole('button', { name: /copiar e-mail/i })).toBeInTheDocument()
  })

  it('writes the value to the clipboard and shows success feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    render(<CopyButton {...LABELS} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('admin@borogodo.ai'))
    await waitFor(() => expect(screen.getAllByText('Copiado!').length).toBeGreaterThan(0))
  })

  it('shows the failure message when the clipboard API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    render(<CopyButton {...LABELS} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByText('Não consegui copiar.')).toBeInTheDocument())
  })

  it('shows the failure message when the clipboard API is absent', async () => {
    vi.stubGlobal('navigator', {})

    render(<CopyButton {...LABELS} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByText('Não consegui copiar.')).toBeInTheDocument())
  })

  it('announces success via an aria-live region', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const { container } = render(<CopyButton {...LABELS} />)
    expect(container.querySelector('[aria-live="polite"]')).toBeTruthy()

    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      const live = container.querySelector('[aria-live="polite"]')
      expect(live?.textContent).toContain('Copiado!')
    })
  })
})
