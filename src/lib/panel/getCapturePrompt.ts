const PROMPT_RECENT_DAYS_LIMIT = 3

export interface CapturePrompt {
  key: 'first' | 'today' | 'yesterday' | 'recentDays' | 'themeNudge' | 'longGap'
  values?: { days?: number; theme?: string }
}

export function getCapturePrompt(days: number | null, themes?: string[]): CapturePrompt {
  if (days === null) return { key: 'first' }
  if (days === 0) return { key: 'today' }
  if (days === 1) return { key: 'yesterday' }
  if (days <= PROMPT_RECENT_DAYS_LIMIT) return { key: 'recentDays', values: { days } }
  if (themes?.length) return { key: 'themeNudge', values: { theme: themes[0] } }
  return { key: 'longGap' }
}
