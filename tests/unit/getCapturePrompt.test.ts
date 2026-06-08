import { describe, it, expect } from 'vitest'
import { getCapturePrompt } from '@/lib/panel/getCapturePrompt'

describe('getCapturePrompt', () => {
  it('returns the first-time prompt when there is no prior capture', () => {
    expect(getCapturePrompt(null)).toBe('Conta uma coisa que você fez no trabalho.')
  })

  it('returns the same-day prompt when captured today', () => {
    expect(getCapturePrompt(0)).toBe('Boa. Tem mais alguma coisa do dia?')
  })

  it('returns the yesterday prompt for 1 day since last capture', () => {
    expect(getCapturePrompt(1)).toBe('O que aconteceu no trabalho ontem?')
  })

  it('returns a recent-days prompt for 2-3 days', () => {
    expect(getCapturePrompt(2)).toBe('Faz 2 dias. O que rolou no trabalho?')
    expect(getCapturePrompt(3)).toBe('Faz 3 dias. O que rolou no trabalho?')
  })

  it('nudges toward a strength theme when there is a gap and themes exist', () => {
    expect(getCapturePrompt(5, ['mediação de conflitos'])).toBe(
      'Sua força em "mediação de conflitos" pede mais evidência. Tem algo recente?'
    )
  })

  it('falls back to the long-gap prompt when there is a gap and no themes', () => {
    expect(getCapturePrompt(5)).toBe('Uma semana é muito tempo. Conta o que você fez.')
    expect(getCapturePrompt(5, [])).toBe('Uma semana é muito tempo. Conta o que você fez.')
  })

  it('uses the long-gap behavior for 7+ days regardless of themes', () => {
    expect(getCapturePrompt(10, ['liderança'])).toBe(
      'Sua força em "liderança" pede mais evidência. Tem algo recente?'
    )
    expect(getCapturePrompt(10)).toBe('Uma semana é muito tempo. Conta o que você fez.')
  })
})
