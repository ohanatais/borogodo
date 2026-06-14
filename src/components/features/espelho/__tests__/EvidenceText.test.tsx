import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/app/[locale]/espelho/actions', () => ({
  getEvidenceEntries: vi.fn(),
}))

import { EvidenceText } from '../EvidenceText'
import { getEvidenceEntries } from '@/app/[locale]/espelho/actions'

const mockGetEvidenceEntries = vi.mocked(getEvidenceEntries)

describe('EvidenceText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the evidence text', () => {
    render(<EvidenceText evidence={{ text: 'Texto da evidência.', entry_ids: [] }} />)
    expect(screen.getByText('Texto da evidência.')).toBeInTheDocument()
  })

  it('does not show toggle chip when entry_ids is empty', () => {
    render(<EvidenceText evidence={{ text: 'Sem links.', entry_ids: [] }} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows toggle chip when entry_ids is not empty', () => {
    render(<EvidenceText evidence={{ text: 'Com links.', entry_ids: ['uuid-1'] }} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('button has aria-expanded=false before toggle', () => {
    render(<EvidenceText evidence={{ text: 'Com links.', entry_ids: ['uuid-1'] }} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  })

  it('button has aria-expanded=true after toggle', async () => {
    mockGetEvidenceEntries.mockResolvedValueOnce([])
    render(<EvidenceText evidence={{ text: 'Com links.', entry_ids: ['uuid-1'] }} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    })
  })

  it('shows empty state copy when fetch returns no entries', async () => {
    mockGetEvidenceEntries.mockResolvedValueOnce([])
    render(<EvidenceText evidence={{ text: 'Com links.', entry_ids: ['uuid-1'] }} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('noEntries')).toBeInTheDocument()
    })
  })

  it('fetches entries on first toggle and shows them', async () => {
    mockGetEvidenceEntries.mockResolvedValueOnce([
      {
        id: 'uuid-1',
        what_i_did: 'Implementei o sistema de pagamento.',
        role_title: 'Engenheira',
        company: 'Acme',
        entry_date: '2026-01-01',
        created_at: '2026-01-01T00:00:00Z',
      },
    ])

    render(<EvidenceText evidence={{ text: 'Evidência.', entry_ids: ['uuid-1'] }} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Engenheira · Acme')).toBeInTheDocument()
    })
    expect(mockGetEvidenceEntries).toHaveBeenCalledWith(['uuid-1'])
  })

  it('does not fetch again on second toggle (uses cache)', async () => {
    mockGetEvidenceEntries.mockResolvedValue([] as never[])

    render(<EvidenceText evidence={{ text: 'Evidência.', entry_ids: ['uuid-1'] }} />)
    const btn = screen.getByRole('button')

    fireEvent.click(btn)
    await waitFor(() => expect(mockGetEvidenceEntries).toHaveBeenCalledTimes(1))

    fireEvent.click(btn)
    fireEvent.click(btn)

    expect(mockGetEvidenceEntries).toHaveBeenCalledTimes(1)
  })

  it('normalizes legacy string evidence via toEvidenceItem', () => {
    render(<EvidenceText evidence="legado como string" />)
    expect(screen.getByText('legado como string')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('truncates long what_i_did to 120 chars', async () => {
    const longText = 'a'.repeat(150)
    mockGetEvidenceEntries.mockResolvedValueOnce([
      { id: 'u1', what_i_did: longText, role_title: null, company: null, entry_date: null, created_at: '2026-01-01T00:00:00Z' },
    ])

    render(<EvidenceText evidence={{ text: 'E.', entry_ids: ['u1'] }} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      const element = screen.getByText(/a+…/)
      expect(element.textContent?.length).toBeLessThanOrEqual(125)
    })
  })
})
