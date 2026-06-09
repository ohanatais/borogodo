const PROMPT_RECENT_DAYS_LIMIT = 3

export function getCapturePrompt(days: number | null, themes?: string[]): string {
  if (days === null) return 'Conta uma coisa que você fez no trabalho.'
  if (days === 0) return 'Boa. Tem mais alguma coisa do dia?'
  if (days === 1) return 'O que aconteceu no trabalho ontem?'
  if (days <= PROMPT_RECENT_DAYS_LIMIT) return `Faz ${days} dias. O que rolou no trabalho?`
  if (themes?.length) return `Sua força em "${themes[0]}" pede mais evidência. Tem algo recente?`
  return 'Uma semana é muito tempo. Conta o que você fez.'
}
