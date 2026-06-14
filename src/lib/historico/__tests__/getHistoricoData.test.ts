import { describe, it, expect } from 'vitest'
import {
  groupPositions,
  getCompanyInitials,
  getCompanyTint,
} from '../getHistoricoData'

const BASE_ENTRY = {
  role_title: 'Product Manager',
  company: 'Acme Corp',
  role_start: '2022-01-01',
  role_end: '2024-06-01',
  what_i_did: 'Liderou o roadmap',
  impact: 'Aumentou retention 20%',
  metric: '20%',
}

describe('getCompanyInitials', () => {
  it('returns first letter of single word', () => {
    expect(getCompanyInitials('Acme')).toBe('A')
  })

  it('returns first two letters of two-word name', () => {
    expect(getCompanyInitials('Acme Corp')).toBe('AC')
  })

  it('returns first two letters ignoring extra words', () => {
    expect(getCompanyInitials('Acme Corp Ltd')).toBe('AC')
  })

  it('uppercases the initials', () => {
    expect(getCompanyInitials('foo bar')).toBe('FB')
  })
})

describe('getCompanyTint', () => {
  it('returns a consistent tint for the same name', () => {
    const a = getCompanyTint('Acme')
    const b = getCompanyTint('Acme')
    expect(a).toEqual(b)
  })

  it('returns different tints for different names (most of the time)', () => {
    const a = getCompanyTint('Apple')
    const b = getCompanyTint('Zymurgy')
    expect(a).not.toEqual(b)
  })

  it('returns bg and fg fields', () => {
    const tint = getCompanyTint('Qualquer')
    expect(tint).toHaveProperty('bg')
    expect(tint).toHaveProperty('fg')
  })
})

describe('groupPositions', () => {
  it('returns empty array for empty input', () => {
    expect(groupPositions([])).toEqual([])
  })

  it('skips entries without company', () => {
    const result = groupPositions([
      { ...BASE_ENTRY, company: null },
    ])
    expect(result).toHaveLength(0)
  })

  it('includes entries with null role_title when company is present', () => {
    const result = groupPositions([{ ...BASE_ENTRY, role_title: null }])
    expect(result).toHaveLength(1)
  })

  it('groups entries with same company regardless of role_title', () => {
    const entries = [
      { ...BASE_ENTRY, role_title: 'PM', what_i_did: 'Tarefa A', impact: null, metric: null },
      { ...BASE_ENTRY, role_title: 'Designer', what_i_did: 'Tarefa B', impact: 'Impacto B', metric: null },
    ]
    const result = groupPositions(entries)
    expect(result).toHaveLength(1)
    expect(result[0].entries).toHaveLength(2)
    expect(result[0].entries[0].what_i_did).toBe('Tarefa A')
    expect(result[0].entries[1].what_i_did).toBe('Tarefa B')
  })

  it('keeps entries from different companies separate', () => {
    const entries = [
      { ...BASE_ENTRY, company: 'Acme', what_i_did: 'A', impact: null, metric: null },
      { ...BASE_ENTRY, company: 'Beta Corp', what_i_did: 'B', impact: null, metric: null },
    ]
    const result = groupPositions(entries)
    expect(result).toHaveLength(2)
  })

  it('limits entries to 8 per company', () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      ...BASE_ENTRY,
      what_i_did: `Tarefa ${i}`,
      impact: null,
      metric: null,
    }))
    const result = groupPositions(entries)
    expect(result[0].entries).toHaveLength(8)
  })

  it('tracks earliest role_start across all entries for the company', () => {
    const entries = [
      { ...BASE_ENTRY, role_start: '2022-03-01', what_i_did: 'First', impact: null, metric: null },
      { ...BASE_ENTRY, role_start: '2021-01-01', what_i_did: 'Second', impact: null, metric: null },
    ]
    const result = groupPositions(entries)
    expect(result[0].role_start).toBe('2021-01-01')
  })

  it('handles position with null role_start', () => {
    const entry = { ...BASE_ENTRY, role_start: null, what_i_did: 'Sem data', impact: null, metric: null }
    const result = groupPositions([entry])
    expect(result).toHaveLength(1)
    expect(result[0].period_label).toBe('?')
    expect(result[0].year_label).toBe('?')
  })

  it('marks current position when role_end is null', () => {
    const entry = { ...BASE_ENTRY, role_end: null, what_i_did: 'Atual', impact: null, metric: null }
    const result = groupPositions([entry])
    expect(result[0].period_label).toContain('atual')
    expect(result[0].year_label).toContain('hoje')
  })

  it('populates company_initials and company_tint', () => {
    const result = groupPositions([BASE_ENTRY])
    expect(result[0].company_initials).toBe('AC')
    expect(result[0].company_tint).toHaveProperty('bg')
    expect(result[0].company_tint).toHaveProperty('fg')
  })
})
