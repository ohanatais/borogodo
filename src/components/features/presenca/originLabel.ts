import type { Draft } from '@/types/content'
import { projectNameFromSeedRef } from '@/lib/content/projectSeed'

/**
 * Texto da evidência de origem mostrado como "Baseado em: {origem}" no hub e reaproveitado como
 * `seedSummary` ao retomar. Degrada com elegância quando a origem sumiu (FR edge case): tema mostra o
 * próprio texto; entrada e projeto usam rótulos estáveis; sem `seedRef` → "origem indisponível".
 *
 * `t` é a função do namespace `presenca` (next-intl) — mantida como parâmetro para o módulo não
 * acoplar a um locale e poder ser testado isoladamente.
 */
export function originLabel(draft: Draft, t: (key: string, values?: Record<string, string>) => string): string {
  if (draft.seedType === 'theme') {
    return draft.seedRef?.trim() ? draft.seedRef : t('origin.unavailable')
  }
  if (draft.seedType === 'project') {
    return draft.seedRef?.trim()
      ? t('origin.project', { name: projectNameFromSeedRef(draft.seedRef) })
      : t('origin.unavailable')
  }
  return t('origin.entry')
}
