import { describe, it, expect } from 'vitest'
import { ENTRY_FORMATS } from '../PresencaCreate'
import { NUDGE_FORMATS, type DraftFormat } from '@/types/content'

describe('formatos oferecidos — impact_summary fora das listas (US4)', () => {
  it('ENTRY_FORMATS não contém impact_summary', () => {
    expect(ENTRY_FORMATS).not.toContain('impact_summary')
    expect(ENTRY_FORMATS).toContain('post')
  })

  it('NUDGE_FORMATS não contém impact_summary', () => {
    expect(NUDGE_FORMATS).not.toContain('impact_summary')
    expect(NUDGE_FORMATS).toContain('post')
  })

  it('DraftFormat permanece com impact_summary (motor/banco intactos)', () => {
    // O type-check garante que o literal continua atribuível ao enum.
    const stillValid: DraftFormat = 'impact_summary'
    expect(stillValid).toBe('impact_summary')
  })
})
