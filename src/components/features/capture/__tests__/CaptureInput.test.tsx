import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CaptureInput } from '../CaptureInput'

const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

describe('CaptureInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders the textarea with the given placeholder', () => {
    render(<CaptureInput placeholder="Conta algo..." mode="registrar" />)
    expect(screen.getByPlaceholderText('Conta algo...')).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    render(<CaptureInput placeholder="Conta algo..." mode="registrar" />)
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument()
  })

  it('disables submit button when input is empty', () => {
    render(<CaptureInput placeholder="Conta algo..." mode="registrar" />)
    expect(screen.getByRole('button', { name: /enviar/i })).toBeDisabled()
  })

  it('enables submit button when text is typed', () => {
    render(<CaptureInput placeholder="Conta algo..." mode="registrar" />)
    fireEvent.change(screen.getByPlaceholderText('Conta algo...'), {
      target: { value: 'Fiz uma coisa importante' },
    })
    expect(screen.getByRole('button', { name: /enviar/i })).not.toBeDisabled()
  })

  it('submits text via POST /api/capture on button click', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    global.fetch = fetchMock

    render(<CaptureInput placeholder="Conta algo..." mode="registrar" />)
    fireEvent.change(screen.getByPlaceholderText('Conta algo...'), {
      target: { value: 'Fiz uma entrega importante' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/capture', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'Fiz uma entrega importante', kind: 'text' }),
      }))
    })
  })

  it('sends kind "question" when mode is perguntar', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    global.fetch = fetchMock

    render(<CaptureInput placeholder="Pergunte algo..." mode="perguntar" />)
    fireEvent.change(screen.getByPlaceholderText('Pergunte algo...'), {
      target: { value: 'Qual é meu ponto forte?' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/capture', expect.objectContaining({
        body: JSON.stringify({ text: 'Qual é meu ponto forte?', kind: 'question' }),
      }))
    })
  })

  it('clears text and calls router.refresh after successful submit', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true })

    render(<CaptureInput placeholder="Conta algo..." mode="registrar" />)
    const textarea = screen.getByPlaceholderText('Conta algo...')
    fireEvent.change(textarea, { target: { value: 'Fiz algo' } })
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
      expect(textarea).toHaveValue('')
    })
  })

  it('shows accessible error message on API failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Algo deu errado' }),
    })

    render(<CaptureInput placeholder="Conta algo..." mode="registrar" />)
    fireEvent.change(screen.getByPlaceholderText('Conta algo...'), {
      target: { value: 'Texto qualquer' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado')
    })
  })

  it('shows error message on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<CaptureInput placeholder="Conta algo..." mode="registrar" />)
    fireEvent.change(screen.getByPlaceholderText('Conta algo...'), {
      target: { value: 'Texto qualquer' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/conexão/i)
    })
  })

  it('submits on Enter key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    global.fetch = fetchMock

    render(<CaptureInput placeholder="Conta algo..." mode="registrar" />)
    const textarea = screen.getByPlaceholderText('Conta algo...')
    fireEvent.change(textarea, { target: { value: 'Press enter test' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
  })

  it('does not submit on Shift+Enter', async () => {
    const fetchMock = vi.fn()
    global.fetch = fetchMock

    render(<CaptureInput placeholder="Conta algo..." mode="registrar" />)
    const textarea = screen.getByPlaceholderText('Conta algo...')
    fireEvent.change(textarea, { target: { value: 'Shift enter test' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
