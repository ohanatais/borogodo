import { describe, it, expect } from 'vitest'
import { validateCaptureResult, validateEntries } from '@/lib/ai/extraction/schemas'

const validEntry = {
  what_i_did: 'Fechei a migração do banco no prazo',
  decision: null,
  learning: null,
  impact: 'Reduziu o downtime em 30%',
  metric: null,
  entry_date: '2026-06-03',
  tags: ['migração', 'decisão sob pressão'],
}

const validReflection = {
  summary: 'Entendi: você concluiu a migração sob prazo apertado — e deu certo.',
  pills: ['decisão sob pressão', 'entrega técnica'],
  move: { type: 'question', text: 'Tem um número de impacto?', field: 'metric' },
}

describe('validateCaptureResult', () => {
  it('aceita um payload com 1 entrada e reflexo válido (1-4 pills, 1 move, field em question)', () => {
    const result = validateCaptureResult(
      { entries: [validEntry], reflection: validReflection },
      'text'
    )

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0]?.source).toBe('text')
    expect(result.reflection.pills.length).toBeGreaterThanOrEqual(1)
    expect(result.reflection.pills.length).toBeLessThanOrEqual(4)
    expect(result.reflection.move.type).toBe('question')
  })

  it('aceita reflexo com pills vazio (LLM pode retornar array vazio)', () => {
    const result = validateCaptureResult(
      { entries: [validEntry], reflection: { ...validReflection, pills: [] } },
      'text'
    )
    expect(result.reflection.pills).toEqual([])
  })

  it('rejeita reflexo com mais de 4 pills', () => {
    expect(() =>
      validateCaptureResult(
        {
          entries: [validEntry],
          reflection: { ...validReflection, pills: ['a', 'b', 'c', 'd', 'e'] },
        },
        'text'
      )
    ).toThrow()
  })

  it('rejeita move com type fora do enum', () => {
    expect(() =>
      validateCaptureResult(
        {
          entries: [validEntry],
          reflection: { ...validReflection, move: { type: 'invalid', text: 'x' } },
        },
        'text'
      )
    ).toThrow()
  })

  it('rejeita JSON malformado / shape inesperado', () => {
    expect(() => validateCaptureResult({ foo: 'bar' }, 'text')).toThrow()
    expect(() => validateCaptureResult(null, 'text')).toThrow()
    expect(() => validateCaptureResult('not an object', 'text')).toThrow()
  })

  it('rejeita lote sem nenhuma entrada', () => {
    expect(() =>
      validateCaptureResult({ entries: [], reflection: validReflection }, 'text')
    ).toThrow()
  })
})

describe('coerce de datas parciais (LinkedIn)', () => {
  it('aceita YYYY-MM-DD sem alteração', () => {
    const [entry] = validateEntries([{ ...validEntry, role_start: '2022-03-01' }], 'linkedin_pdf')
    expect(entry?.role_start).toBe('2022-03-01')
  })

  it('coerce YYYY-MM para o primeiro dia do mês', () => {
    const [entry] = validateEntries([{ ...validEntry, role_start: '2022-03', role_end: '2024-11' }], 'linkedin_pdf')
    expect(entry?.role_start).toBe('2022-03-01')
    expect(entry?.role_end).toBe('2024-11-01')
  })

  it('coerce YYYY para o primeiro dia do ano', () => {
    const [entry] = validateEntries([{ ...validEntry, entry_date: '2023', role_start: '2021' }], 'linkedin_pdf')
    expect(entry?.entry_date).toBe('2023-01-01')
    expect(entry?.role_start).toBe('2021-01-01')
  })

  it('descarta strings de data inválidas como null', () => {
    const [entry] = validateEntries([{ ...validEntry, role_start: 'Jan 2022', role_end: 'Present' }], 'linkedin_pdf')
    expect(entry?.role_start).toBeNull()
    expect(entry?.role_end).toBeNull()
  })
})

describe('validateEntries', () => {
  it('valida um lote de entradas com source e tags', () => {
    const result = validateEntries([validEntry, { ...validEntry, what_i_did: 'Outra entrada' }], 'linkedin_pdf')

    expect(result).toHaveLength(2)
    expect(result.every((entry) => entry.source === 'linkedin_pdf')).toBe(true)
    expect(result.every((entry) => Array.isArray(entry.tags))).toBe(true)
  })

  it('rejeita o lote inteiro se uma entrada falhar na validação', () => {
    expect(() =>
      validateEntries([validEntry, { ...validEntry, what_i_did: '' }], 'linkedin_pdf')
    ).toThrow()
  })

  it('aplica o limite maxEntries', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ ...validEntry, what_i_did: `Entrada ${i}` }))

    const result = validateEntries(many, 'linkedin_pdf', 3)

    expect(result).toHaveLength(3)
  })
})
