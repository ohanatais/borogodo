import { describe, it, expect } from 'vitest'
import { buildCareerChatSystemPrompt, type CareerChatContext } from '../careerChat'

const BASE: CareerChatContext = {
  profile: null,
  latestMirror: null,
  relevantEntries: [],
  companyEntries: [],
  correctionEntry: null,
}

describe('buildCareerChatSystemPrompt — modo preparação (017)', () => {
  it('injeta o enquadramento do momento quando prepMoment está presente', () => {
    const prompt = buildCareerChatSystemPrompt({ ...BASE, prepMoment: 'entrevista' })
    expect(prompt).toContain('MODO PREPARAÇÃO')
    expect(prompt).toContain('ENTREVISTA')
  })

  it('cada momento tem um enquadramento distinto', () => {
    const review = buildCareerChatSystemPrompt({ ...BASE, prepMoment: 'review' })
    const salario = buildCareerChatSystemPrompt({ ...BASE, prepMoment: 'salario' })
    expect(review).toContain('AVALIAÇÃO DE DESEMPENHO')
    expect(salario).toContain('AUMENTO')
  })

  it('sem prepMoment, não há bloco de preparação', () => {
    const prompt = buildCareerChatSystemPrompt(BASE)
    expect(prompt).not.toContain('MODO PREPARAÇÃO')
  })
})
