import { describe, it, expect, vi } from 'vitest'
import { assist, AssistFailedError } from '../assist'

describe('assist — rephrase (reescreve com as palavras da pessoa)', () => {
  it('reformula só o texto da pessoa e devolve a sugestão (Sonnet)', async () => {
    const complete = vi.fn().mockResolvedValue('Liderei o lançamento e acompanhei a adoção de perto.')

    const result = await assist(
      { mode: 'rephrase', section: 'entregas', text: 'eu liderei o lançamento e fiquei de olho na adoção' },
      complete
    )

    expect(result).toEqual({
      mode: 'rephrase',
      suggestion: 'Liderei o lançamento e acompanhei a adoção de perto.',
    })
    // Usa o modelo de síntese (Sonnet) e injeta APENAS o texto da pessoa no prompt.
    expect(complete).toHaveBeenCalledTimes(1)
    const req = complete.mock.calls[0][0]
    expect(req.role).toBe('synthesis')
    expect(req.user).toContain('fiquei de olho na adoção')
  })

  it('regenera uma vez quando a saída viola o ruleset anti-IA e falha de novo → AssistFailedError', async () => {
    // Travessão (—) viola o assert 1; as duas tentativas violam → degrada.
    const complete = vi.fn().mockResolvedValue('Liderei o lançamento — e acompanhei a adoção.')

    await expect(
      assist({ mode: 'rephrase', section: 'entregas', text: 'liderei o lançamento' }, complete)
    ).rejects.toBeInstanceOf(AssistFailedError)
    expect(complete).toHaveBeenCalledTimes(2)
  })

  it('aceita na 2ª tentativa quando a reescrita volta limpa', async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce('Liderei o lançamento — sujo.')
      .mockResolvedValueOnce('Liderei o lançamento, limpo.')
    const result = await assist({ mode: 'rephrase', section: 'entregas', text: 'liderei' }, complete)
    expect(result).toEqual({ mode: 'rephrase', suggestion: 'Liderei o lançamento, limpo.' })
  })
})

describe('assist — unblock (1 pergunta, a resposta vira o rascunho da pessoa)', () => {
  it('devolve UMA pergunta ancorada no período; nunca escreve a autoavaliação', async () => {
    const complete = vi.fn().mockResolvedValue('Qual entrega desse período te deixou mais orgulhosa?')

    const result = await assist(
      { mode: 'unblock', section: 'entregas', seedRef: 'period:::2025-01-01:::2025-12-31' },
      complete
    )

    expect(result).toEqual({
      mode: 'unblock',
      question: 'Qual entrega desse período te deixou mais orgulhosa?',
    })
    expect(complete).toHaveBeenCalledTimes(1)
    expect(complete.mock.calls[0][0].role).toBe('synthesis')
  })
})

describe('assist — star_nudge (heurística determinística, sem LLM)', () => {
  it('texto vago sem número/resultado → devolve o prompt de impacto; NÃO chama o LLM', async () => {
    const complete = vi.fn()
    const result = await assist(
      { mode: 'star_nudge', section: 'impacto', text: 'fiz um ótimo trabalho no projeto' },
      complete
    )
    expect(result.mode).toBe('star_nudge')
    expect((result as { prompt: string | null }).prompt).toBeTruthy()
    expect(complete).not.toHaveBeenCalled()
  })

  it('texto que já tem número/resultado → sem nudge (prompt null); nunca propõe o número', async () => {
    const complete = vi.fn()
    const result = await assist(
      { mode: 'star_nudge', section: 'impacto', text: 'a adoção subiu de 41% para 58% em quatro trimestres' },
      complete
    )
    expect((result as { prompt: string | null }).prompt).toBeNull()
    expect(complete).not.toHaveBeenCalled()
  })
})
