import { describe, it, expect } from 'vitest'
import { buildProjectSeedRef, parseProjectSeedRef, projectNameFromSeedRef } from '../projectSeed'

describe('projectSeed', () => {
  it('faz round-trip build → parse', () => {
    const ref = buildProjectSeedRef('Acme', 'Migração 0→1')
    expect(parseProjectSeedRef(ref)).toEqual({ company: 'Acme', projectName: 'Migração 0→1' })
  })

  it('extrai o nome do projeto do seedRef', () => {
    expect(projectNameFromSeedRef(buildProjectSeedRef('Acme', 'Lançamento'))).toBe('Lançamento')
  })

  it('devolve null para um ref que não é de projeto', () => {
    expect(parseProjectSeedRef('produto 0→1')).toBeNull()
  })

  it('projectName degrada para o próprio ref quando não é chave de projeto', () => {
    expect(projectNameFromSeedRef('tema solto')).toBe('tema solto')
  })

  it('company é o que vem antes do primeiro separador (nome de projeto pode conter o separador)', () => {
    const ref = buildProjectSeedRef('Acme', 'A:::B')
    expect(parseProjectSeedRef(ref)).toEqual({ company: 'Acme', projectName: 'A:::B' })
  })
})
