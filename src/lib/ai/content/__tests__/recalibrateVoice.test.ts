import { describe, it, expect, vi } from 'vitest'
import {
  recalibrateVoice,
  shouldSuggestRecalibration,
  RECALIBRATE_NAO_SOA_THRESHOLD,
} from '../recalibrateVoice'
import type { VoiceProfile } from '@/types/content'

const NEW_SUMMARY = 'Frases mais curtas, tom mais seco, menos adjetivo. Primeira pessoa, sem floreio.'

describe('recalibrateVoice — aplica com consentimento, preservando amostras', () => {
  it('atualiza o inferredSummary e PRESERVA as amostras explícitas e o tone', async () => {
    const complete = vi.fn().mockResolvedValue(NEW_SUMMARY)
    const existing: VoiceProfile = {
      tone: 'direto',
      lengthPref: 'curto',
      samples: ['Minha amostra colada, a fonte da verdade.'],
      inferredSummary: 'voz antiga inferida',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }

    const profile = await recalibrateVoice(
      { existing, soaSamples: ['rascunho que soou'], naoSoaSamples: ['rascunho que não soou'] },
      complete
    )

    expect(profile.inferredSummary).toBe(NEW_SUMMARY)
    expect(profile.samples).toEqual(existing.samples) // âncora preservada
    expect(profile.tone).toBe('direto')
    expect(profile.lengthPref).toBe('curto')
    expect(profile.updatedAt).not.toBe(existing.updatedAt) // updated_at novo
    expect(complete).toHaveBeenCalledTimes(1)
    expect(complete.mock.calls[0][0].role).toBe('synthesis')
  })

  it('passa os rascunhos "soa" e "não soa" para o prompt (usa o feedback de fato)', async () => {
    const complete = vi.fn().mockResolvedValue(NEW_SUMMARY)

    await recalibrateVoice(
      { existing: null, soaSamples: ['ISSO SOOU'], naoSoaSamples: ['ISSO NAO SOOU'] },
      complete
    )

    const userPrompt = complete.mock.calls[0][0].user as string
    expect(userPrompt).toContain('ISSO SOOU')
    expect(userPrompt).toContain('ISSO NAO SOOU')
  })

  it('lança quando o LLM volta em branco (não grava voz vazia nem finge sucesso)', async () => {
    const complete = vi.fn().mockResolvedValue('   ')
    await expect(
      recalibrateVoice({ existing: null, soaSamples: ['x'], naoSoaSamples: ['y'] }, complete)
    ).rejects.toThrow()
  })

  it('sem sinal nenhum, não chama o LLM e mantém o perfil inalterado', async () => {
    const complete = vi.fn()
    const existing: VoiceProfile = {
      samples: ['amostra'],
      inferredSummary: 'voz',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }

    const profile = await recalibrateVoice({ existing, soaSamples: [], naoSoaSamples: [] }, complete)

    expect(complete).not.toHaveBeenCalled()
    expect(profile).toEqual(existing)
  })
})

describe('shouldSuggestRecalibration — só sugere com sinal acumulado e novo', () => {
  const at = (iso: string) => ({ soaCount: 0, naoSoaCount: 5, lastFeedbackAt: iso })

  it('não sugere abaixo do limiar de "não soa"', () => {
    const signal = { soaCount: 2, naoSoaCount: RECALIBRATE_NAO_SOA_THRESHOLD - 1, lastFeedbackAt: '2026-02-01T00:00:00.000Z' }
    expect(shouldSuggestRecalibration(signal, null)).toBe(false)
  })

  it('sugere no limiar quando ainda não há voz calibrada', () => {
    const signal = { soaCount: 0, naoSoaCount: RECALIBRATE_NAO_SOA_THRESHOLD, lastFeedbackAt: '2026-02-01T00:00:00.000Z' }
    expect(shouldSuggestRecalibration(signal, null)).toBe(true)
  })

  it('não sugere quando todo o feedback é anterior à última recalibração', () => {
    const voice: VoiceProfile = { samples: [], updatedAt: '2026-03-01T00:00:00.000Z' }
    expect(shouldSuggestRecalibration(at('2026-02-01T00:00:00.000Z'), voice)).toBe(false)
  })

  it('sugere quando há feedback novo após a última recalibração', () => {
    const voice: VoiceProfile = { samples: [], updatedAt: '2026-01-01T00:00:00.000Z' }
    expect(shouldSuggestRecalibration(at('2026-02-01T00:00:00.000Z'), voice)).toBe(true)
  })
})
