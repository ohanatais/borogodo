import { describe, it, expect } from 'vitest'
import { buildEntryTitle } from '@/lib/capture/buildEntryTitle'

describe('buildEntryTitle', () => {
  it('usa a primeira linha não-vazia, sem alterar o conteúdo', () => {
    expect(buildEntryTitle('resolvi um bug hoje')).toBe('resolvi um bug hoje')
  })

  it('ignora linhas em branco antes da primeira linha com conteúdo', () => {
    expect(buildEntryTitle('\n\n   \nfechei a negociação com o cliente')).toBe(
      'fechei a negociação com o cliente'
    )
  })

  it('usa só a primeira linha quando há múltiplas linhas', () => {
    expect(buildEntryTitle('título aqui\nresto do texto\nmais uma linha')).toBe('título aqui')
  })

  it('faz trim de espaços nas bordas da primeira linha', () => {
    expect(buildEntryTitle('   texto com espaços nas pontas   \noutra linha')).toBe(
      'texto com espaços nas pontas'
    )
  })

  it('retorna string vazia para texto vazio ou só espaços', () => {
    expect(buildEntryTitle('')).toBe('')
    expect(buildEntryTitle('   \n   \n  ')).toBe('')
  })

  it('mantém texto igual ou menor que 80 caracteres sem truncar', () => {
    const exact80 = 'a'.repeat(80)
    expect(buildEntryTitle(exact80)).toBe(exact80)
    expect(buildEntryTitle(exact80).length).toBe(80)
  })

  it('trunca em 80 caracteres cortando no limite de palavra, com reticências', () => {
    const longLine =
      'Fechamos a negociação com o cliente mais importante do trimestre depois de meses de idas e vindas'
    const title = buildEntryTitle(longLine)

    expect(title.length).toBeLessThanOrEqual(80)
    expect(title.endsWith('…')).toBe(true)
    // não deve cortar no meio de uma palavra: o caractere antes da reticência não é seguido de
    // letra no texto original naquele ponto (ou seja, terminou em fronteira de espaço)
    expect(longLine.startsWith(title.slice(0, -1).trimEnd())).toBe(true)
  })

  it('trunca uma única palavra muito longa (sem espaço) sem quebrar', () => {
    const singleWord = 'a'.repeat(120)
    const title = buildEntryTitle(singleWord)

    expect(title.length).toBeLessThanOrEqual(80)
    expect(title.endsWith('…')).toBe(true)
  })
})
