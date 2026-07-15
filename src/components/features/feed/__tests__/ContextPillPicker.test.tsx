import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContextPillPicker } from '../ContextPillPicker'

function renderPicker(overrides: Partial<React.ComponentProps<typeof ContextPillPicker>> = {}) {
  const onChange = vi.fn()
  const props = {
    entryId: 'entry-1',
    company: null,
    isPersonalProject: false,
    vocabulary: ['Acme Corp', 'Beta Ltda'],
    onChange,
    ...overrides,
  }
  render(<ContextPillPicker {...props} />)
  return { onChange }
}

describe('ContextPillPicker (US2, feature 026)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('T026 — renderiza pílulas do vocabulário + "Projeto pessoal" + "Outro"', () => {
    renderPicker()

    expect(screen.getByRole('button', { name: 'Acme Corp' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Beta Ltda' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'context.personalProjectLabel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'context.otherLabel' })).toBeInTheDocument()
  })

  it('T026 — selecionar uma pílula de empresa dispara PATCH imediato, sem chamada de IA', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    const { onChange } = renderPicker()

    fireEvent.click(screen.getByRole('button', { name: 'Acme Corp' }))

    expect(fetch).toHaveBeenCalledWith(
      '/api/entries/entry-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ company: 'Acme Corp', is_personal_project: false }),
      })
    )
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('/organize'), expect.anything())
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ company: 'Acme Corp', isPersonalProject: false }))
  })

  it('selecionar "Projeto pessoal" envia is_personal_project: true e company: null', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    renderPicker({ company: 'Acme Corp' })

    fireEvent.click(screen.getByRole('button', { name: 'context.personalProjectLabel' }))

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/entries/entry-1',
        expect.objectContaining({
          body: JSON.stringify({ company: null, is_personal_project: true }),
        })
      )
    )
  })

  it('selecionar "Outro" abre campo de texto livre; confirmar com Enter grava o valor e vira pílula', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    renderPicker()

    fireEvent.click(screen.getByRole('button', { name: 'context.otherLabel' }))
    const input = screen.getByRole('textbox', { name: 'context.otherLabel' })
    fireEvent.change(input, { target: { value: 'Freela X' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/entries/entry-1',
        expect.objectContaining({
          body: JSON.stringify({ company: 'Freela X', is_personal_project: false }),
        })
      )
    )
  })

  it('marca a pílula ativa quando company já corresponde a uma pílula do vocabulário', () => {
    renderPicker({ company: 'Acme Corp' })

    expect(screen.getByRole('button', { name: 'Acme Corp' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Beta Ltda' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('mostra campo de busca só quando o vocabulário tem mais de 8 empresas', () => {
    const bigVocabulary = Array.from({ length: 9 }, (_, i) => `Empresa ${i}`)
    renderPicker({ vocabulary: bigVocabulary })

    expect(screen.getByPlaceholderText('context.searchPlaceholder')).toBeInTheDocument()
  })

  it('não mostra campo de busca com 8 ou menos empresas', () => {
    renderPicker({ vocabulary: Array.from({ length: 8 }, (_, i) => `Empresa ${i}`) })

    expect(screen.queryByPlaceholderText('context.searchPlaceholder')).not.toBeInTheDocument()
  })

  it('reverte o estado otimista quando o PATCH falha', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, json: async () => ({}) } as Response)
    const { onChange } = renderPicker()

    fireEvent.click(screen.getByRole('button', { name: 'Acme Corp' }))

    await waitFor(() => expect(onChange).not.toHaveBeenCalled())
  })
})
