import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DraftCard } from '../DraftCard'

const mockCreateDraft = vi.fn()
const mockPatchDraft = vi.fn()
vi.mock('../draftsClient', () => ({
  createDraft: (...args: unknown[]) => mockCreateDraft(...args),
  patchDraft: (...args: unknown[]) => mockPatchDraft(...args),
}))

const VARIANT = { angle: 'o aprendizado', body: 'Primeiro rascunho na sua voz.', evidenceRefs: ['E1'] }
const SEED = { seedType: 'theme', seedRef: 'produto 0→1' } as const

function renderCard() {
  return render(<DraftCard variant={VARIANT} index={0} format="post" seed={SEED} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateDraft.mockResolvedValue({ id: 'draft-1' })
  mockPatchDraft.mockResolvedValue({ id: 'draft-1' })
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  })
})

describe('DraftCard', () => {
  it('mostra o ângulo e o corpo gerados', () => {
    renderCard()
    expect(screen.getByText('o aprendizado')).toBeInTheDocument()
    expect(screen.getByText('Primeiro rascunho na sua voz.')).toBeInTheDocument()
  })

  it('copiar persiste o rascunho, marca copied e confirma na UI', async () => {
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'copy' }))

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(VARIANT.body))
    await waitFor(() => expect(mockCreateDraft).toHaveBeenCalledTimes(1))
    expect(mockPatchDraft).toHaveBeenCalledWith('draft-1', { status: 'copied' })
    expect(await screen.findByRole('button', { name: 'copied' })).toBeInTheDocument()
  })

  it('editar inline cria o rascunho como edited com o novo corpo', async () => {
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'edit' }))

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Versão editada.' } })
    fireEvent.blur(textarea)

    await waitFor(() => expect(mockCreateDraft).toHaveBeenCalledTimes(1))
    expect(mockCreateDraft).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'edited', body: 'Versão editada.' })
    )
  })

  it('responder "não soa" persiste o feedback sem regerar', async () => {
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'voice.no' }))

    await waitFor(() => expect(mockCreateDraft).toHaveBeenCalledTimes(1))
    expect(mockPatchDraft).toHaveBeenCalledWith('draft-1', { voiceFeedback: 'nao_soa' })
    expect(screen.getByRole('button', { name: 'voice.no' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('não persiste nada quando o usuário só lê o rascunho', () => {
    renderCard()
    expect(mockCreateDraft).not.toHaveBeenCalled()
    expect(mockPatchDraft).not.toHaveBeenCalled()
  })
})
