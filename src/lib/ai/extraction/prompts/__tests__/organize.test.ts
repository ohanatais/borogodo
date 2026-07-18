import { describe, it, expect } from 'vitest'
import { buildOrganizeUserPrompt, CAPTURE_ORGANIZE_SYSTEM_PROMPT } from '../organize'

describe('CAPTURE_ORGANIZE_SYSTEM_PROMPT — instruções de tags consistentes (Story 6)', () => {
  it('FR-022 — instrui a reaproveitar o vocabulário de tags já usado em vez de criar variação', () => {
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT).toContain('FR-022')
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT.toLowerCase()).toContain('vocabulário de tags')
  })

  it('FR-023 — instrui a seguir a mesma capitalização/idioma do vocabulário ao criar tag nova', () => {
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT).toContain('FR-023')
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT.toLowerCase()).toContain('capitalização')
  })

  it('FR-024 — proíbe explicitamente adjetivo genérico isolado como tag, com exemplos', () => {
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT).toContain('FR-024')
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT.toLowerCase()).toContain('adjetivo')
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT).toContain('importante')
  })
})

describe('CAPTURE_ORGANIZE_SYSTEM_PROMPT — impact nunca infere consequência não afirmada no texto (revisão pós-implementação, 026)', () => {
  it('proíbe explicitamente inferir desdobramento futuro/decisão de terceiro não afirmada no texto', () => {
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT.toLowerCase()).toContain('nunca infira um desdobramento futuro')
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT.toLowerCase()).toContain('decisão de terceiros')
  })

  it('mostra o exemplo real de alucinação encontrado em produção (satisfação → "contratou para a próxima fase")', () => {
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT).toContain('Cliente contratou a empresa')
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT.toLowerCase()).toContain('isso não foi dito')
  })

  it('explica por que a regra é dura, não estilística — registro pode virar prova em currículo/entrevista', () => {
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT.toLowerCase()).toContain('regra dura')
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT.toLowerCase()).toContain('currículo')
  })
})

describe('CAPTURE_ORGANIZE_SYSTEM_PROMPT — título outcome-first (Story 5)', () => {
  it('FR-019 — instrui título substantivo-primeiro/outcome-first, com número quando presente', () => {
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT).toContain('FR-019')
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT.toLowerCase()).toContain('outcome-first')
  })

  it('FR-020 — instrui a nunca sobrescrever um título já editado manualmente', () => {
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT).toContain('FR-020')
  })

  it('mostra o exemplo bom da spec, com o número puxado para o título (Acceptance Scenario 1)', () => {
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT).toContain('Redução de 50% no tempo de investigação de bug crítico')
  })

  it('proíbe nominalização vaga usando o exemplo genérico exato da spec ("Otimização de processos")', () => {
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT).toContain('Otimização de processos')
  })

  it('instrui buscar o objeto concreto mais próximo no texto cru em vez de repetir o termo vago (Acceptance Scenario 3)', () => {
    expect(CAPTURE_ORGANIZE_SYSTEM_PROMPT.toLowerCase()).toContain('objeto concreto')
  })
})

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
