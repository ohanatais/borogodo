import { describe, it, expect } from 'vitest'
import { deriveOrganizationStatus, isOrganizingRecently, ORGANIZING_TIMEOUT_MS } from '../organizationStatus'

describe('deriveOrganizationStatus', () => {
  it('retorna "not_organized" quando nem organized_at nem organizing_started_at estão setados', () => {
    expect(deriveOrganizationStatus(null, null)).toBe('not_organized')
  })

  it('retorna "organized" quando organized_at está preenchido', () => {
    expect(deriveOrganizationStatus('2026-07-15T10:00:00.000Z', null)).toBe('organized')
  })

  it('prioriza "organized" mesmo se organizing_started_at ainda estiver presente (estado defensivo)', () => {
    const now = Date.now()
    expect(
      deriveOrganizationStatus('2026-07-15T10:00:00.000Z', new Date(now).toISOString(), now)
    ).toBe('organized')
  })

  it('retorna "organizing" quando organizing_started_at é recente e organized_at ainda não existe', () => {
    const now = Date.now()
    const startedAt = new Date(now - 1_000).toISOString()
    expect(deriveOrganizationStatus(null, startedAt, now)).toBe('organizing')
  })

  it('retorna "not_organized" quando organizing_started_at está travado além do timeout (FR-030)', () => {
    const now = Date.now()
    const staleStartedAt = new Date(now - (ORGANIZING_TIMEOUT_MS + 1_000)).toISOString()
    expect(deriveOrganizationStatus(null, staleStartedAt, now)).toBe('not_organized')
  })
})

describe('isOrganizingRecently', () => {
  it('retorna false quando startedAt é null', () => {
    expect(isOrganizingRecently(null)).toBe(false)
  })

  it('retorna true dentro da janela de tolerância', () => {
    const now = Date.now()
    expect(isOrganizingRecently(new Date(now - 500).toISOString(), now)).toBe(true)
  })

  it('retorna false fora da janela de tolerância', () => {
    const now = Date.now()
    expect(isOrganizingRecently(new Date(now - (ORGANIZING_TIMEOUT_MS + 1)).toISOString(), now)).toBe(false)
  })
})
