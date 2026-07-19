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

describe('buildCareerChatSystemPrompt — fontes organizadas (026)', () => {
  it('entrega ao chat a fonte canônica e seus destaques organizados', () => {
    const prompt = buildCareerChatSystemPrompt({
      ...BASE,
      relevantEntries: [{
        id: 'entry-1', user_id: 'user-1', what_i_did: 'Resumo legado', raw_content: 'Fonte completa do registro',
        decision: null, learning: null, impact: null, metric: null, entry_date: '2026-07-19', tags: [],
        company: null, role_title: null, role_start: null, role_end: null, project_name: null, source: 'deposito',
        created_at: '2026-07-19T12:00:00.000Z', updated_at: '2026-07-19T12:00:00.000Z',
        entry_highlights: [{ title: 'Resultado organizado', metric: '30%', impact: 'Mais previsibilidade', tags: [], position: 0 }],
      }],
    })

    expect(prompt).toContain('Fonte completa do registro')
    expect(prompt).toContain('Resultado organizado | 30% | Mais previsibilidade')
  })
})
