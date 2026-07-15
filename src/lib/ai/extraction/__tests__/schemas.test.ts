import { describe, it, expect } from 'vitest'
import { validateEntries, validateOrganizeResult } from '../schemas'

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

  it('title maior que 80 chars é descartado silenciosamente (LLM não respeitou o limite)', () => {
    const entries = validateEntries(
      [{ ...BASE_RAW, title: 'a'.repeat(81) }],
      'text',
      undefined,
      'raw'
    )

    expect(entries[0].title).toBeUndefined()
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

describe('organizeResultSchema — validação do resultado de "Organizar" (026)', () => {
  it('valida o shape completo: highlights com título/métrica/impacto/tags + company/entry_date', () => {
    const result = validateOrganizeResult({
      highlights: [
        { title: 'Reduziu tempo de deploy em 30%', metric: '30%', impact: 'menos fricção no time', tags: ['devops'] },
      ],
      company: 'Acme Corp',
      entry_date: '2026-07-01',
    })

    expect(result.highlights).toHaveLength(1)
    expect(result.highlights[0]).toMatchObject({
      title: 'Reduziu tempo de deploy em 30%',
      metric: '30%',
      impact: 'menos fricção no time',
      tags: ['devops'],
    })
    expect(result.company).toBe('Acme Corp')
    expect(result.entry_date).toBe('2026-07-01')
  })

  it('trata title/metric/impact ausentes de um highlight como opcionais, sem lançar', () => {
    const result = validateOrganizeResult({ highlights: [{ tags: ['reuniao'] }] })

    expect(result.highlights[0].title).toBeNull()
    expect(result.highlights[0].metric).toBeNull()
    expect(result.highlights[0].impact).toBeNull()
  })

  it('tolera tags ausente ou vazio num highlight (default para array vazio)', () => {
    const result = validateOrganizeResult({ highlights: [{ title: 'Sem tags ainda' }, { tags: [] }] })

    expect(result.highlights[0].tags).toEqual([])
    expect(result.highlights[1].tags).toEqual([])
  })

  it('company/entry_date ausentes viram null (nunca undefined)', () => {
    const result = validateOrganizeResult({ highlights: [] })

    expect(result.company).toBeNull()
    expect(result.entry_date).toBeNull()
  })

  it('rejeita quando highlights não é um array', () => {
    expect(() => validateOrganizeResult({ highlights: 'not-an-array' })).toThrow()
  })

  it('rejeita quando highlights está ausente', () => {
    expect(() => validateOrganizeResult({})).toThrow()
  })

  it('FR-024 — remove tag que é um adjetivo genérico isolado, mantendo as demais tags do highlight', () => {
    const result = validateOrganizeResult({
      highlights: [{ title: 'Refatorou serviço de pagamentos', tags: ['importante', 'pagamentos', 'difícil'] }],
    })

    expect(result.highlights[0].tags).toEqual(['pagamentos'])
  })

  it('FR-024 — bloqueia adjetivo genérico mesmo com capitalização diferente (case-insensitive)', () => {
    const result = validateOrganizeResult({
      highlights: [{ title: 'Conduziu projeto', tags: ['Produtivo', 'PROATIVO', 'liderança'] }],
    })

    expect(result.highlights[0].tags).toEqual(['liderança'])
  })

  it('FR-024 — highlight cujas tags são só adjetivos genéricos fica com array de tags vazio (não lança)', () => {
    const result = validateOrganizeResult({
      highlights: [{ title: 'Fez algo', tags: ['eficiente', 'engajado'] }],
    })

    expect(result.highlights[0].tags).toEqual([])
  })

  it('FR-023 — normaliza capitalização de uma tag nova para minúsculas (formato consistente)', () => {
    const result = validateOrganizeResult({
      highlights: [{ title: 'Liderou squad', tags: ['Liderança de Equipe'] }],
    })

    expect(result.highlights[0].tags).toEqual(['liderança de equipe'])
  })

  it('FR-023 — normalizar capitalização não deve criar tag duplicada quando a IA devolve variações da mesma tag', () => {
    const result = validateOrganizeResult({
      highlights: [{ title: 'Fez migração', tags: ['DevOps', 'devops', ' DevOps '] }],
    })

    expect(result.highlights[0].tags).toEqual(['devops'])
  })

  it('FR-023 — remove espaços nas pontas de uma tag', () => {
    const result = validateOrganizeResult({
      highlights: [{ title: 'Fez migração', tags: ['  devops  '] }],
    })

    expect(result.highlights[0].tags).toEqual(['devops'])
  })
})
