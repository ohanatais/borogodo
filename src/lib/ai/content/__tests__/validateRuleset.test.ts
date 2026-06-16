import { describe, it, expect } from 'vitest'
import { validateContentRuleset } from '../validateRuleset'

// Texto limpo: passa em todas as 9 regras (zero violações). Serve de regressão da disciplina anti-IA.
const CLEAN =
  'Liderei o lançamento do app de pagamentos junto com o time de engenharia. ' +
  'Reduzimos o tempo de resposta de 800ms para 200ms em três meses, e os primeiros ' +
  'clientes começaram a usar logo na primeira semana.'

describe('validateContentRuleset — texto limpo', () => {
  it('não retorna nenhuma violação para texto que respeita a disciplina', () => {
    expect(validateContentRuleset(CLEAN)).toEqual([])
  })

  it('não lança e retorna vazio para string vazia', () => {
    expect(validateContentRuleset('')).toEqual([])
  })

  it('marca o `field` informado na violação', () => {
    const v = validateContentRuleset('Entreguei tudo — no prazo.', 'variants[0].body')
    expect(v[0].field).toBe('variants[0].body')
  })
})

describe('validateContentRuleset — uma regra por assert', () => {
  function asserts(text: string): number[] {
    return validateContentRuleset(text).map((v) => v.assert)
  }

  it('assert 1: travessão (—)', () => {
    expect(asserts('Entreguei o projeto — no prazo.')).toContain(1)
  })

  it('assert 2: buzzword banida (data-driven, proativo)', () => {
    expect(asserts('Sou um PM data-driven e bem proativo.')).toContain(2)
  })

  it('assert 3: antítese ("não é X, é Y")', () => {
    expect(asserts('Isso não é sorte, é método no dia a dia.')).toContain(3)
  })

  it('assert 3: antítese ("deixou de ser X")', () => {
    expect(asserts('O time deixou de ser reativo com o tempo.')).toContain(3)
  })

  it('assert 4: advérbio de ênfase vazio (simplesmente)', () => {
    expect(asserts('Foi simplesmente o melhor lançamento do ano.')).toContain(4)
  })

  it('assert 5: jargão de IA / tradução do inglês (mover a agulha)', () => {
    expect(asserts('Precisávamos mover a agulha do negócio naquele momento.')).toContain(5)
  })

  it('assert 6: jargão vazio de LinkedIn (comente abaixo)', () => {
    expect(asserts('Curtiu? Comente abaixo o que você achou.')).toContain(6)
  })

  it('assert 7: métrica de mudança sem janela de tempo', () => {
    expect(asserts('Subi a ativação de 20% para 45%.')).toContain(7)
  })

  it('assert 7: a mesma métrica COM janela de tempo não viola', () => {
    expect(asserts('Subi a ativação de 20% para 45% em dois trimestres.')).not.toContain(7)
  })

  it('assert 8: gíria de elogio (mandou bem)', () => {
    expect(asserts('Você mandou bem demais nesse projeto.')).toContain(8)
  })

  it('assert 9: brasilidade boba (emoji)', () => {
    expect(asserts('Que entrega incrível 🚀')).toContain(9)
  })

  it('assert 9: brasilidade boba (jeitinho)', () => {
    expect(asserts('Resolvi tudo no jeitinho de sempre.')).toContain(9)
  })
})

describe('validateContentRuleset — assert 10: clichê de bio (015)', () => {
  function asserts(text: string): number[] {
    return validateContentRuleset(text).map((v) => v.assert)
  }

  it('pega "apaixonado por tecnologia"', () => {
    expect(asserts('Sou apaixonado por tecnologia e inovação.')).toContain(10)
  })

  it('pega "apaixonada por" (variação de gênero)', () => {
    expect(asserts('Apaixonada por produto desde sempre.')).toContain(10)
  })

  it('pega "transformando ideias em realidade"', () => {
    expect(asserts('Vivo transformando ideias em realidade.')).toContain(10)
  })

  it('pega "profissional movido a desafios"', () => {
    expect(asserts('Profissional movido a desafios e a resultados.')).toContain(10)
  })

  it('pega "em busca de novos desafios"', () => {
    expect(asserts('Estou sempre em busca de novos desafios.')).toContain(10)
  })

  it('pega "entusiasta de"', () => {
    expect(asserts('Entusiasta de inteligência artificial.')).toContain(10)
  })

  it('não acusa uma bio concreta e factual', () => {
    const concreta =
      'Lidero o time de dados de uma fintech há três anos. Antes disso, fui analista no varejo, ' +
      'onde montei o primeiro painel de vendas da empresa.'
    expect(asserts(concreta)).not.toContain(10)
  })
})

describe('validateContentRuleset — acumula múltiplas violações', () => {
  it('retorna uma violação por classe quando o texto peca em várias', () => {
    const ruim = 'Esse projeto data-driven foi simplesmente um game changer 🚀'
    const found = validateContentRuleset(ruim).map((v) => v.assert)
    expect(found).toEqual(expect.arrayContaining([2, 4, 6, 9]))
  })
})
