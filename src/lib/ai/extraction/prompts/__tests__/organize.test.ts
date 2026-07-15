import { describe, it, expect } from 'vitest'
import { buildOrganizeUserPrompt } from '../organize'

describe('buildOrganizeUserPrompt — prompt de "Organizar" (026)', () => {
  it('inclui pedido de inferência de empresa/período quando a fonte ainda não tem contexto resolvido', () => {
    const prompt = buildOrganizeUserPrompt('Fiz uma migração de banco de dados hoje', {
      company: null,
      isPersonalProject: false,
      entryDate: null,
      tagVocabulary: [],
      existingHighlights: [],
    })

    expect(prompt).toContain('empresa')
    expect(prompt).toContain('período')
  })

  it('OMITE qualquer pedido de empresa quando a fonte já tem `company` resolvido (FR-004/FR-006)', () => {
    const prompt = buildOrganizeUserPrompt('Fiz uma migração de banco de dados hoje', {
      company: 'Acme Corp',
      isPersonalProject: false,
      entryDate: null,
      tagVocabulary: [],
      existingHighlights: [],
    })

    expect(prompt.toLowerCase()).not.toContain('infira a empresa')
  })

  it('OMITE qualquer pedido de período quando a fonte já tem `entry_date` resolvido', () => {
    const prompt = buildOrganizeUserPrompt('Fiz uma migração de banco de dados hoje', {
      company: null,
      isPersonalProject: false,
      entryDate: '2026-07-01',
      tagVocabulary: [],
      existingHighlights: [],
    })

    expect(prompt.toLowerCase()).not.toContain('infira o período')
  })

  it('OMITE qualquer pedido de empresa quando isPersonalProject=true, mesmo com company vazio (US2, FR-004)', () => {
    const prompt = buildOrganizeUserPrompt('Fiz um projeto pessoal de estudo de SQL', {
      company: null,
      isPersonalProject: true,
      entryDate: null,
      tagVocabulary: [],
      existingHighlights: [],
    })

    expect(prompt.toLowerCase()).not.toContain('infira a empresa')
    expect(prompt).toContain('Projeto pessoal')
  })

  it('inclui o vocabulário de tags da pessoa quando fornecido (Story 6)', () => {
    const prompt = buildOrganizeUserPrompt('texto', {
      company: null,
      isPersonalProject: false,
      entryDate: null,
      tagVocabulary: ['liderança', 'devops'],
      existingHighlights: [],
    })

    expect(prompt).toContain('liderança')
    expect(prompt).toContain('devops')
  })

  it('inclui os destaques já existentes para a IA não repeti-los', () => {
    const prompt = buildOrganizeUserPrompt('texto', {
      company: null,
      isPersonalProject: false,
      entryDate: null,
      tagVocabulary: [],
      existingHighlights: [{ title: 'Já organizado antes', metric: '10%', impact: null, tags: ['x'] }],
    })

    expect(prompt).toContain('Já organizado antes')
  })

  it('inclui o texto cru da fonte no prompt', () => {
    const prompt = buildOrganizeUserPrompt('Reduzi o tempo de build em 40%', {
      company: null,
      isPersonalProject: false,
      entryDate: null,
      tagVocabulary: [],
      existingHighlights: [],
    })

    expect(prompt).toContain('Reduzi o tempo de build em 40%')
  })
})
