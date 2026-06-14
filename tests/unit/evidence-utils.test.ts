import { describe, it, expect } from 'vitest'
import { toEvidenceItem } from '@/types/mirror'

describe('toEvidenceItem', () => {
  it('pass-through de objeto válido com entry_ids', () => {
    const input = { text: 'Evidência real.', entry_ids: ['uuid-1', 'uuid-2'] }
    const result = toEvidenceItem(input)
    expect(result).toEqual({ text: 'Evidência real.', entry_ids: ['uuid-1', 'uuid-2'] })
  })

  it('pass-through de objeto sem entry_ids resulta em array vazio', () => {
    const input = { text: 'Só texto.' }
    const result = toEvidenceItem(input)
    expect(result).toEqual({ text: 'Só texto.', entry_ids: [] })
  })

  it('compatibilidade retroativa: string vira { text, entry_ids: [] }', () => {
    const result = toEvidenceItem('evidência legada como string')
    expect(result).toEqual({ text: 'evidência legada como string', entry_ids: [] })
  })

  it('null retorna fallback vazio', () => {
    expect(toEvidenceItem(null)).toEqual({ text: '', entry_ids: [] })
  })

  it('undefined retorna fallback vazio', () => {
    expect(toEvidenceItem(undefined)).toEqual({ text: '', entry_ids: [] })
  })

  it('número retorna fallback vazio', () => {
    expect(toEvidenceItem(42)).toEqual({ text: '', entry_ids: [] })
  })

  it('objeto com text não-string usa string vazia para text', () => {
    const result = toEvidenceItem({ text: 123, entry_ids: [] })
    expect(result.text).toBe('')
    expect(result.entry_ids).toEqual([])
  })

  it('objeto com entry_ids não-array usa array vazio', () => {
    const result = toEvidenceItem({ text: 'ok', entry_ids: 'not-array' })
    expect(result.text).toBe('ok')
    expect(result.entry_ids).toEqual([])
  })
})
