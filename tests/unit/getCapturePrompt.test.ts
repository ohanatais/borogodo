import { describe, it, expect } from 'vitest'
import { getCapturePrompt } from '@/lib/panel/getCapturePrompt'

describe('getCapturePrompt', () => {
  it('returns the first-time prompt key when there is no prior capture', () => {
    expect(getCapturePrompt(null)).toEqual({ key: 'first' })
  })

  it('returns the same-day prompt key when captured today', () => {
    expect(getCapturePrompt(0)).toEqual({ key: 'today' })
  })

  it('returns the yesterday prompt key for 1 day since last capture', () => {
    expect(getCapturePrompt(1)).toEqual({ key: 'yesterday' })
  })

  it('returns a recent-days prompt key with the day count for 2-3 days', () => {
    expect(getCapturePrompt(2)).toEqual({ key: 'recentDays', values: { days: 2 } })
    expect(getCapturePrompt(3)).toEqual({ key: 'recentDays', values: { days: 3 } })
  })

  it('nudges toward a strength theme when there is a gap and themes exist', () => {
    expect(getCapturePrompt(5, ['mediação de conflitos'])).toEqual({
      key: 'themeNudge',
      values: { theme: 'mediação de conflitos' },
    })
  })

  it('falls back to the long-gap prompt key when there is a gap and no themes', () => {
    expect(getCapturePrompt(5)).toEqual({ key: 'longGap' })
    expect(getCapturePrompt(5, [])).toEqual({ key: 'longGap' })
  })

  it('uses the long-gap behavior for 7+ days regardless of themes', () => {
    expect(getCapturePrompt(10, ['liderança'])).toEqual({
      key: 'themeNudge',
      values: { theme: 'liderança' },
    })
    expect(getCapturePrompt(10)).toEqual({ key: 'longGap' })
  })
})
