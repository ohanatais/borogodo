import { describe, it, expect } from 'vitest'
import {
  groupCompanies,
  getCompanyInitials,
  getCompanyTint,
  levenshtein,
} from '../getHistoricoData'

const BASE_ENTRY = {
  id: 'entry-1',
  role_title: 'Product Manager',
  company: 'Acme Corp',
  role_start: '2022-01-01',
  role_end: '2024-06-01',
  what_i_did: 'Liderou o roadmap',
  impact: 'Aumentou retention 20%',
  metric: '20%',
  project_name: null,
  evidences: [],
  is_personal_project: false,
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

describe('groupCompanies', () => {
  it('returns empty array for empty input', () => {
    expect(groupCompanies([])).toEqual([])
  })

  it('skips entries without company', () => {
    const result = groupCompanies([{ ...BASE_ENTRY, company: null }])
    expect(result).toHaveLength(0)
  })

  it('includes entries with null role_title', () => {
    const result = groupCompanies([{ ...BASE_ENTRY, role_title: null }])
    expect(result).toHaveLength(1)
  })

  it('groups entries with same company into one HistoricoCompany', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', role_title: 'PM', what_i_did: 'Tarefa A', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e2', role_title: 'Designer', what_i_did: 'Tarefa B', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    expect(result).toHaveLength(1)
  })

  it('keeps different companies separate', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', company: 'Acme', what_i_did: 'A', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e2', company: 'Beta Corp', what_i_did: 'B', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    expect(result).toHaveLength(2)
  })

  it('groups entries with same role title and year into a single RolePeriod', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', role_title: 'PM', role_start: '2022-06-01', role_end: '2024-06-01', what_i_did: 'A', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e2', role_title: 'PM', role_start: '2022-06-15', role_end: '2024-06-01', what_i_did: 'B', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    expect(result[0].roles).toHaveLength(1)
    expect(result[0].roles[0]).toHaveProperty('year_label')
  })

  it('deduplicates same role repeated with slightly different start dates in same year', () => {
    // Simulates multiple entries from same job where AI assigned different role_start dates
    const entries = [
      { ...BASE_ENTRY, id: 'e1', role_title: 'PM', role_start: '2024-01-01', role_end: null, what_i_did: 'A', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e2', role_title: 'PM', role_start: '2024-06-01', role_end: null, what_i_did: 'B', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e3', role_title: 'PM', role_start: '2024-11-01', role_end: null, what_i_did: 'C', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    // All three entries share "PM|||2024|||current" key → single role
    expect(result[0].roles).toHaveLength(1)
  })

  it('creates separate RolePeriods for different role titles', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', role_title: 'Junior PM', role_start: '2021-06-01', role_end: '2022-12-31', what_i_did: 'A', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e2', role_title: 'Senior PM', role_start: '2023-06-01', role_end: null, what_i_did: 'B', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    expect(result[0].roles).toHaveLength(2)
  })

  it('flattens legacy project entries into the career evidence', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', what_i_did: 'Feature X', project_name: 'Alpha', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    expect(result[0].projects).toHaveLength(0)
    expect(result[0].highlight_bullets).toContain('Feature X')
  })

  it('includes a personal project in the trajectory without inventing a company', () => {
    const result = groupCompanies([
      { ...BASE_ENTRY, id: 'personal-1', company: null, is_personal_project: true, what_i_did: 'Lancei um produto autoral' },
    ])

    expect(result[0].company).toBe('Projetos pessoais')
    expect(result[0].highlight_bullets).toContain('Lancei um produto autoral')
  })

  it('uses organized highlights, rather than the raw source, in the trajectory narrative', () => {
    const result = groupCompanies([{
      ...BASE_ENTRY,
      id: 'organized-1',
      what_i_did: 'Transcrição longa e crua da conversa',
      entry_highlights: [{ title: 'Reduziu o ciclo de entrega', metric: '30%', impact: 'Mais previsibilidade' }],
    }])

    expect(result[0].highlight_bullets).toEqual(['Reduziu o ciclo de entrega'])
  })

  it('does not turn legacy interview transcripts into a fake career company', () => {
    const result = groupCompanies([{ ...BASE_ENTRY, company: 'Entrevistas', what_i_did: 'transcrição inteira' }])
    expect(result).toEqual([])
  })

  it('keeps multiple legacy project entries as separate evidence', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', what_i_did: 'Tarefa A', project_name: 'Alpha', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e2', what_i_did: 'Tarefa B', project_name: 'Alpha', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    expect(result[0].highlight_bullets).toEqual(['Tarefa A', 'Tarefa B'])
  })

  it('deduplicates legacy project entries with the same what_i_did', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', what_i_did: 'Mesmo conteúdo', project_name: 'Alpha', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e2', what_i_did: 'Mesmo conteúdo', project_name: 'Alpha', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    expect(result[0].highlight_bullets).toHaveLength(1)
  })

  it('deduplicates standalone entries with the same what_i_did', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', what_i_did: 'Mesmo bullet', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e2', what_i_did: 'Mesmo bullet', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    expect(result[0].highlight_bullets).toHaveLength(1)
  })

  it('preserves legacy project entries in the flattened narrative', () => {
    const evidences = [{ type: 'url' as const, value: 'https://example.com', label: 'Demo' }]
    const entries = [
      { ...BASE_ENTRY, id: 'e-unique', what_i_did: 'Feature X', project_name: 'Alpha', impact: null, metric: null, evidences },
    ]
    const result = groupCompanies(entries)
    expect(result[0].highlight_bullets).toContain('Feature X')
  })

  it('limits highlight_bullets to 3', () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({
      ...BASE_ENTRY,
      id: `e${i}`,
      what_i_did: `Tarefa ${i}`,
      impact: null,
      metric: null,
    }))
    const result = groupCompanies(entries)
    expect(result[0].highlight_bullets).toHaveLength(3)
  })

  it('sorts highlight_bullets metric-first', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', what_i_did: 'Sem métrica', metric: null, impact: null },
      { ...BASE_ENTRY, id: 'e2', what_i_did: 'Com métrica', metric: '20%', impact: null },
    ]
    const result = groupCompanies(entries)
    expect(result[0].highlight_bullets[0]).toBe('Com métrica')
  })

  it('tracks earliest role_start for year_label', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', role_start: '2022-06-01', what_i_did: 'First', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e2', role_start: '2021-06-01', what_i_did: 'Second', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    expect(result[0].year_label).toMatch(/2021/)
  })

  it('handles null role_start gracefully', () => {
    const entry = { ...BASE_ENTRY, id: 'e1', role_start: null, what_i_did: 'Sem data', impact: null, metric: null }
    const result = groupCompanies([entry])
    expect(result).toHaveLength(1)
    expect(result[0].year_label).toBe('?')
  })

  it('marks year_label as current when role_end is null', () => {
    const entry = { ...BASE_ENTRY, id: 'e1', role_end: null, what_i_did: 'Atual', impact: null, metric: null }
    const result = groupCompanies([entry])
    expect(result[0].year_label).toContain('hoje')
  })

  it('populates company_initials and company_tint', () => {
    const result = groupCompanies([BASE_ENTRY])
    expect(result[0].company_initials).toBe('AC')
    expect(result[0].company_tint).toHaveProperty('bg')
    expect(result[0].company_tint).toHaveProperty('fg')
  })

  it('merges company with typo (Levenshtein ≤ 2) into canonical name', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', company: 'Cheesecake Labs', what_i_did: 'Criou feature', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e2', company: 'Cheesake Labs', what_i_did: 'Corrigiu bug', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    expect(result).toHaveLength(1)
    expect(result[0].company).toBe('Cheesecake Labs')
  })

  it('keeps companies separate when Levenshtein distance > 2', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', company: 'Acme Corp', what_i_did: 'Tarefa A', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e2', company: 'Beta Corp', what_i_did: 'Tarefa B', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    expect(result).toHaveLength(2)
  })

  it('merges company with one char typo (e.g. missing letter)', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', company: 'Nubank', what_i_did: 'Produto A', impact: null, metric: null },
      { ...BASE_ENTRY, id: 'e2', company: 'Nubak', what_i_did: 'Produto B', impact: null, metric: null },
    ]
    const result = groupCompanies(entries)
    expect(result).toHaveLength(1)
  })
})

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('acme', 'acme')).toBe(0)
  })

  it('returns 1 for single insertion', () => {
    expect(levenshtein('acme', 'acmee')).toBe(1)
  })

  it('returns 1 for single deletion', () => {
    expect(levenshtein('abc', 'ac')).toBe(1)
    expect(levenshtein('cheesecake', 'cheesake')).toBe(2)
  })

  it('returns correct distance for transposition', () => {
    expect(levenshtein('nubank', 'nubnak')).toBe(2)
  })

  it('handles empty strings', () => {
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('abc', '')).toBe(3)
    expect(levenshtein('', '')).toBe(0)
  })
})
