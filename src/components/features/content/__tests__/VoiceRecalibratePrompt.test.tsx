import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VoiceRecalibratePrompt } from '../VoiceRecalibratePrompt'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ recalibrated: true }) })
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('VoiceRecalibratePrompt', () => {
  it('mostra a sugestão e os dois caminhos (afinar / agora não)', async () => {
    render(<VoiceRecalibratePrompt signalKey="sig-1" />)
    expect(await screen.findByText('suggestion')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'accept' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'dismiss' })).toBeInTheDocument()
  })

  it('aceitar aplica COM consentimento (apply: true) e mostra o "pronto"', async () => {
    render(<VoiceRecalibratePrompt signalKey="sig-1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'accept' }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/content/voice/recalibrate')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ apply: true })

    expect(await screen.findByText('done')).toBeInTheDocument()
  })

  it('dispensar esconde a sugestão e lembra a dispensa para o mesmo sinal', async () => {
    const { unmount } = render(<VoiceRecalibratePrompt signalKey="sig-1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'dismiss' }))
    await waitFor(() => expect(screen.queryByText('suggestion')).not.toBeInTheDocument())

    // Remonta com o MESMO sinal: continua dispensada (não volta a incomodar).
    unmount()
    render(<VoiceRecalibratePrompt signalKey="sig-1" />)
    await waitFor(() => expect(screen.queryByText('suggestion')).not.toBeInTheDocument())
  })

  it('volta a aparecer quando chega sinal novo (signalKey diferente)', async () => {
    window.localStorage.setItem('borogodo:voice-recalibrate-dismissed', 'sig-1')
    render(<VoiceRecalibratePrompt signalKey="sig-2" />)
    expect(await screen.findByText('suggestion')).toBeInTheDocument()
  })

  it('mostra erro honesto quando a aplicação falha (a voz não mudou)', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) })
    render(<VoiceRecalibratePrompt signalKey="sig-1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'accept' }))
    expect(await screen.findByText('error')).toBeInTheDocument()
    expect(screen.queryByText('done')).not.toBeInTheDocument()
  })
})
