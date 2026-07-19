import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Reflection } from '@/types/capture'
import type { Mirror } from '@/types/mirror'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { CaptureLoopStep } from '../CaptureLoopStep'

const mockReflection: Reflection = {
  summary: 'Você demonstrou liderança técnica sólida.',
  pills: ['liderança', 'entrega'],
  move: { type: 'affirmation', text: 'Isso mostra consistência.' },
}

const mockMirror: Mirror = {
  intro: 'Você é uma profissional de alto impacto.',
  primary_strength: {
    headline: 'Liderança em ambientes de pressão',
    evidence: { text: 'Evidência', entry_ids: [] },
  },
  invisible_skill: {
    headline: 'Capacidade de síntese',
    evidence: { text: 'Evidência', entry_ids: [] },
  },
  context_pattern: {
    headline: 'Atua melhor em autonomia',
    evidence: { text: 'Evidência', entry_ids: [] },
  },
  closing: 'Esse é o seu borogodó.',
  strength_themes: ['Liderança', 'Entrega', 'Estratégia'],
  categories: [],
}

describe('CaptureLoopStep', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  function uploadPdf() {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['pdf'], 'curriculo.pdf', { type: 'application/pdf' })] } })
  }

  it('renders PDF import as the onboarding action', () => {
    render(<CaptureLoopStep />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ctaLinkedin' })).toBeInTheDocument()
  })

  it('generates the mirror after capture returns without a reflection', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [{ id: 'e1' }], reflection: null }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ mirror: mockMirror }),
      } as Response)

    render(<CaptureLoopStep />)
    await act(async () => {
      uploadPdf()
    })

    await waitFor(() => expect(screen.getByText('Liderança em ambientes de pressão')).toBeInTheDocument())
  })

  it('shows error message on capture API failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Algo deu errado no servidor.' }),
    } as Response)

    render(<CaptureLoopStep />)
    await act(async () => {
      uploadPdf()
    })

    await waitFor(() =>
      expect(screen.getByText('Algo deu errado no servidor.')).toBeInTheDocument()
    )
  })

  it('shows mirror headline after sufficient evaluation', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [{ id: 'e1' }], reflection: mockReflection }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ mirror: mockMirror }),
      } as Response)

    render(<CaptureLoopStep />)
    await act(async () => {
      uploadPdf()
    })

    await waitFor(
      () => expect(screen.getByText('Liderança em ambientes de pressão')).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('shows retry button on error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    } as Response)

    render(<CaptureLoopStep />)
    await act(async () => {
      uploadPdf()
    })

    await waitFor(() =>
      // t('retry') → 'retry'
      expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument()
    )
  })
})
