import { describe, it, expect, vi } from 'vitest'
import { forwardStep, ForwardStepFailedError } from '../forwardStep'

const BODY = [
  'Entregas:',
  'Liderei o lançamento do app de pagamentos.',
  '',
  'Pontos a desenvolver:',
  'Quero afiar negociação com fornecedores e priorização sob pressa.',
].join('\n')

function jsonBlock(obj: unknown): string {
  return '```json\n' + JSON.stringify(obj) + '\n```'
}

const VALID_PLAN = {
  area: 'negociação com fornecedores',
  experienceAction: 'Conduzir pessoalmente a próxima negociação de contrato, do briefing ao fechamento.',
  commitmentQuestion: 'Qual será a primeira negociação que você vai conduzir sozinha, e quando?',
  // Trecho LITERAL copiado do body (prova de não-invenção).
  anchoredOn: ['Quero afiar negociação com fornecedores e priorização sob pressa.'],
}

describe('forwardStep — plano de ação ancorado só no que a pessoa escreveu (US2, 019)', () => {
  it('gera o plano (GROW + 70-20-10) e devolve kind action_plan com generatedAt', async () => {
    const complete = vi.fn().mockResolvedValue(jsonBlock(VALID_PLAN))

    const result = await forwardStep({ body: BODY }, complete)

    expect(result.kind).toBe('action_plan')
    expect(result.actionPlan?.area).toBe('negociação com fornecedores')
    expect(result.anchoredOn[0]).toContain('negociação com fornecedores')
    expect(result.generatedAt).toBeTruthy()
    // Insumo é SÓ o body (Sonnet, role synthesis).
    expect(complete.mock.calls[0][0].role).toBe('synthesis')
    expect(complete.mock.calls[0][0].user).toContain('Quero afiar negociação')
  })

  it('BLOQUEIA invenção: âncora que não está no body → 1 retry → ForwardStepFailedError', async () => {
    // anchoredOn cita algo que a pessoa NUNCA escreveu (lastro fabricado).
    const invented = { ...VALID_PLAN, area: 'liderança de vendas globais', anchoredOn: ['Liderei vendas globais em 12 países'] }
    const complete = vi.fn().mockResolvedValue(jsonBlock(invented))

    await expect(forwardStep({ body: BODY }, complete)).rejects.toBeInstanceOf(ForwardStepFailedError)
    expect(complete).toHaveBeenCalledTimes(2)
  })

  it('aceita na 2ª tentativa quando a primeira inventa e a segunda volta ancorada', async () => {
    const invented = { ...VALID_PLAN, anchoredOn: ['caso que ela não escreveu'] }
    const complete = vi
      .fn()
      .mockResolvedValueOnce(jsonBlock(invented))
      .mockResolvedValueOnce(jsonBlock(VALID_PLAN))

    const result = await forwardStep({ body: BODY }, complete)
    expect(result.actionPlan?.area).toBe('negociação com fornecedores')
    expect(complete).toHaveBeenCalledTimes(2)
  })

  it('saída malformada (sem JSON) também conta como falha e regenera', async () => {
    const complete = vi.fn().mockResolvedValue('sem json nenhum aqui')
    await expect(forwardStep({ body: BODY }, complete)).rejects.toBeInstanceOf(ForwardStepFailedError)
    expect(complete).toHaveBeenCalledTimes(2)
  })
})
