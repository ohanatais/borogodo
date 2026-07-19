import { describe, it, expect } from 'vitest'
import { deriveContextStatus } from '../contextStatus'

describe('deriveContextStatus', () => {
  it('T028 — retorna "unresolved" quando nem empresa nem projeto pessoal foram resolvidos (FR-008)', () => {
    expect(deriveContextStatus(null, false)).toBe('unresolved')
  })

  it('retorna "company" quando company está preenchida', () => {
    expect(deriveContextStatus('Acme Corp', false)).toBe('company')
  })

  it('retorna "personal_project" quando is_personal_project é true, mesmo sem company', () => {
    expect(deriveContextStatus(null, true)).toBe('personal_project')
  })

  it('prioriza "personal_project" sobre "company" quando ambos estão presentes (estado inconsistente defensivo)', () => {
    expect(deriveContextStatus('Acme Corp', true)).toBe('personal_project')
  })
})
