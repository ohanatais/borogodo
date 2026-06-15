import { describe, it, expect, vi } from 'vitest'
import { buildVoiceProfile } from '../buildVoiceProfile'

const SUMMARY = 'Frases curtas e diretas. Tom caloroso, primeira pessoa, vocabulário concreto.'

describe('buildVoiceProfile', () => {
  it('infere o inferredSummary a partir do raw_content e marca updatedAt', async () => {
    const complete = vi.fn().mockResolvedValue(SUMMARY)
    const profile = await buildVoiceProfile(
      { rawContents: ['liderei um lançamento e deu certo'], existing: null },
      complete
    )

    expect(profile.inferredSummary).toBe(SUMMARY)
    expect(complete).toHaveBeenCalledTimes(1)
    expect(complete.mock.calls[0][0].role).toBe('synthesis')
    expect(typeof profile.updatedAt).toBe('string')
    expect(profile.updatedAt.length).toBeGreaterThan(0)
  })

  it('limita as amostras a no máximo 2 e ignora vazias', async () => {
    const complete = vi.fn().mockResolvedValue(SUMMARY)
    const profile = await buildVoiceProfile(
      { rawContents: [], existing: null, samples: ['  ', 'amostra um', 'amostra dois', 'amostra três'] },
      complete
    )

    expect(profile.samples).toEqual(['amostra um', 'amostra dois'])
  })

  it('preserva tone e lengthPref informados', async () => {
    const complete = vi.fn().mockResolvedValue(SUMMARY)
    const profile = await buildVoiceProfile(
      { rawContents: ['texto'], existing: null, tone: 'direto', lengthPref: 'curto' },
      complete
    )

    expect(profile.tone).toBe('direto')
    expect(profile.lengthPref).toBe('curto')
  })

  it('não chama o LLM quando não há material (mantém o summary anterior)', async () => {
    const complete = vi.fn()
    const existing = { samples: [], inferredSummary: 'voz antiga', updatedAt: '2026-01-01T00:00:00.000Z' }
    const profile = await buildVoiceProfile({ rawContents: ['   '], existing }, complete)

    expect(complete).not.toHaveBeenCalled()
    expect(profile.inferredSummary).toBe('voz antiga')
  })

  it('funde as amostras existentes quando nenhuma nova é passada', async () => {
    const complete = vi.fn().mockResolvedValue(SUMMARY)
    const existing = { samples: ['minha amostra'], updatedAt: '2026-01-01T00:00:00.000Z' }
    const profile = await buildVoiceProfile({ rawContents: ['texto cru'], existing }, complete)

    expect(profile.samples).toEqual(['minha amostra'])
  })
})
