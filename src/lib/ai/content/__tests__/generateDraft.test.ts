import { describe, it, expect, vi } from 'vitest'
import { generateDraft, type GenerateDraftInput } from '../generateDraft'
import { GenerationFailedError } from '@/lib/errors'

function jsonBlock(obj: unknown): string {
  return '```json\n' + JSON.stringify(obj) + '\n```'
}

const CLEAN_OUTPUT = {
  variants: [
    { angle: 'o aprendizado', body: 'Liderei o lançamento com o time. Funcionou na primeira semana.', evidence_refs: ['E1'] },
    { angle: 'quem participou', body: 'Construí isso junto com engenharia e design.', evidence_refs: ['E2'] },
  ],
}

// Viola o ruleset: "simplesmente" (4) + "game changer" (6) na 1ª; "mandou bem" (8) na 2ª.
const DIRTY_OUTPUT = {
  variants: [
    { angle: 'a', body: 'Esse projeto foi simplesmente um game changer.', evidence_refs: ['E1'] },
    { angle: 'b', body: 'O time mandou bem demais.', evidence_refs: ['E2'] },
  ],
}

const BASE_INPUT: GenerateDraftInput = {
  format: 'post',
  seedSummary: 'produto 0→1',
  evidence: [
    { label: 'E1', text: 'Liderou 9 produtos de 0 a 1' },
    { label: 'E2', text: 'Reviews 5 estrelas no Clutch' },
  ],
  voiceProfile: null,
}

describe('generateDraft — caminho feliz', () => {
  it('devolve 2 variantes válidas em uma única chamada quando a saída passa', async () => {
    const complete = vi.fn().mockResolvedValue(jsonBlock(CLEAN_OUTPUT))
    const result = await generateDraft(BASE_INPUT, complete)

    expect(result.variants).toHaveLength(2)
    expect(result.variants[0].evidenceRefs).toEqual(['E1'])
    expect(complete).toHaveBeenCalledTimes(1)
    expect(complete.mock.calls[0][0].role).toBe('synthesis')
  })

  it('mapeia evidence_refs (snake) para evidenceRefs (camel)', async () => {
    const complete = vi.fn().mockResolvedValue(jsonBlock(CLEAN_OUTPUT))
    const result = await generateDraft(BASE_INPUT, complete)
    expect(result.variants[1].evidenceRefs).toEqual(['E2'])
  })

  it('usa o system prompt do formato impact_summary', async () => {
    const complete = vi.fn().mockResolvedValue(jsonBlock(CLEAN_OUTPUT))
    await generateDraft({ ...BASE_INPUT, format: 'impact_summary' }, complete)
    expect(complete.mock.calls[0][0].system).toContain('resumo de impacto')
  })
})

describe('generateDraft — mini-bio (US3 da 015)', () => {
  const MINI_BIO_OUTPUT = {
    variants: [
      { angle: 'mais direta', body: 'Sou PM há oito anos, hoje lidero produto numa fintech. Construí times de discovery do zero.', evidence_refs: ['E1'] },
      { angle: 'mais narrativa', body: 'Comecei em dados e migrei para produto. Hoje cuido da área de pagamentos de uma fintech.', evidence_refs: ['E2'] },
    ],
  }

  it('usa o system prompt da mini-bio (com a regra anti-clichê) e devolve 2 variantes que passam no ruleset', async () => {
    const complete = vi.fn().mockResolvedValue(jsonBlock(MINI_BIO_OUTPUT))
    const result = await generateDraft({ ...BASE_INPUT, format: 'mini_bio' }, complete)

    expect(result.variants).toHaveLength(2)
    expect(complete.mock.calls[0][0].system).toContain('mini-bio')
    expect(complete.mock.calls[0][0].system).toContain('CLICHÊ DE BIO')
  })

  it('regenera quando a bio sai com clichê de bio (assert 10) e fica limpa na 2ª', async () => {
    const DIRTY_BIO = {
      variants: [
        { angle: 'a', body: 'Profissional apaixonado por tecnologia e movido a desafios.', evidence_refs: ['E1'] },
        { angle: 'b', body: 'Sou PM numa fintech há oito anos.', evidence_refs: ['E2'] },
      ],
    }
    const complete = vi
      .fn()
      .mockResolvedValueOnce(jsonBlock(DIRTY_BIO))
      .mockResolvedValueOnce(jsonBlock(MINI_BIO_OUTPUT))

    const result = await generateDraft({ ...BASE_INPUT, format: 'mini_bio' }, complete)

    expect(result.variants).toHaveLength(2)
    expect(complete).toHaveBeenCalledTimes(2)
    expect(complete.mock.calls[1][0].user).toContain('violou as regras')
  })
})

describe('generateDraft — regeneração única', () => {
  it('regenera uma vez ao detectar violação do ruleset e injeta o feedback', async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce(jsonBlock(DIRTY_OUTPUT))
      .mockResolvedValueOnce(jsonBlock(CLEAN_OUTPUT))

    const result = await generateDraft(BASE_INPUT, complete)

    expect(result.variants).toHaveLength(2)
    expect(complete).toHaveBeenCalledTimes(2)
    expect(complete.mock.calls[1][0].user).toContain('violou as regras')
  })

  it('regenera uma vez quando a saída vem malformada (sem bloco JSON)', async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce('resposta sem json nenhum')
      .mockResolvedValueOnce(jsonBlock(CLEAN_OUTPUT))

    const result = await generateDraft(BASE_INPUT, complete)

    expect(result.variants).toHaveLength(2)
    expect(complete).toHaveBeenCalledTimes(2)
  })
})

describe('generateDraft — falha após a 2ª tentativa', () => {
  it('lança GenerationFailedError quando o ruleset falha nas duas tentativas', async () => {
    const complete = vi.fn().mockResolvedValue(jsonBlock(DIRTY_OUTPUT))

    await expect(generateDraft(BASE_INPUT, complete)).rejects.toBeInstanceOf(GenerationFailedError)
    expect(complete).toHaveBeenCalledTimes(2)
  })

  it('lança GenerationFailedError quando vem malformado nas duas tentativas', async () => {
    const complete = vi.fn().mockResolvedValue('nunca tem json')
    await expect(generateDraft(BASE_INPUT, complete)).rejects.toBeInstanceOf(GenerationFailedError)
    expect(complete).toHaveBeenCalledTimes(2)
  })
})

// T006 — RED (Phase 3 US1): ângulo de estudo
describe('generateDraft — ângulo de estudo (US1)', () => {
  const STUDY_OUTPUT = {
    variants: [
      { angle: 'o aprendizado', body: 'Estudei análise de cohort do zero enquanto liderava produto numa fintech.', evidence_refs: ['E1'] },
      { angle: 'a mudança de perspectiva', body: 'Aprendi a olhar retenção como confiança acumulada ao longo dos trimestres.', evidence_refs: ['E2'] },
    ],
  }

  it('injeta o bloco de ângulo de estudo no user prompt', async () => {
    const complete = vi.fn().mockResolvedValue(jsonBlock(STUDY_OUTPUT))
    await generateDraft({ ...BASE_INPUT, format: 'post', angleKind: 'study' }, complete)
    expect(complete.mock.calls[0][0].user).toContain('ÂNGULO: Estudo')
  })

  it('devolve 2 variantes que passam no ruleset com angleKind study', async () => {
    const complete = vi.fn().mockResolvedValue(jsonBlock(STUDY_OUTPUT))
    const result = await generateDraft({ ...BASE_INPUT, format: 'post', angleKind: 'study' }, complete)
    expect(result.variants).toHaveLength(2)
    expect(result.variants[0].evidenceRefs).toEqual(['E1'])
  })

  it('não injeta bloco de ângulo quando angleKind é nulo', async () => {
    const complete = vi.fn().mockResolvedValue(jsonBlock(CLEAN_OUTPUT))
    await generateDraft({ ...BASE_INPUT, format: 'post', angleKind: null }, complete)
    expect(complete.mock.calls[0][0].user).not.toContain('ÂNGULO:')
  })
})
