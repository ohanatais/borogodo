import { describe, it, expect } from 'vitest'
import { validateEntries } from '../schemas'

const BASE_RAW = {
  what_i_did: 'Liderou roadmap do produto',
  tags: [],
}

describe('T025 — title no schema de extração', () => {
  it('title presente no JSON extraído passa validação Zod', () => {
    const entries = validateEntries(
      [{ ...BASE_RAW, title: 'Lançou redesign do checkout' }],
      'text',
      undefined,
      'raw'
    )

    expect(entries[0].title).toBe('Lançou redesign do checkout')
  })

  it('ausência de title é tratada graciosamente (campo opcional)', () => {
    const entries = validateEntries([BASE_RAW], 'text', undefined, 'raw')

    expect(entries[0].title).toBeUndefined()
  })

  it('title maior que 80 chars falha a validação', () => {
    expect(() =>
      validateEntries(
        [{ ...BASE_RAW, title: 'a'.repeat(81) }],
        'text',
        undefined,
        'raw'
      )
    ).toThrow()
  })

  it('title com exatamente 80 chars passa a validação', () => {
    const entries = validateEntries(
      [{ ...BASE_RAW, title: 'a'.repeat(80) }],
      'text',
      undefined,
      'raw'
    )

    expect(entries[0].title).toHaveLength(80)
  })
})
