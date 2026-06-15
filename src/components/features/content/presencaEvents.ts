import type { DraftFormat, SeedType } from '@/types/content'

// Contrato do evento que abre a superfície de geração. Mantido num módulo sem JSX para que o ponto
// de entrada (UsarButton) e a superfície (GenerateSheet) compartilhem o tipo sem acoplar bundles.

export const PRESENCA_OPEN_EVENT = 'borogodo:presenca-open'

export interface PresencaOpenDetail {
  seedType: SeedType
  seedRef: string
  /** Texto curto da evidência base, mostrado como "Baseado em:". */
  seedSummary: string
  /** Formatos oferecidos: tema → ['post']; entrada → ['post', 'impact_summary']. */
  formats: DraftFormat[]
}

/** Dispara a abertura da superfície de geração com a evidência carregada (nunca página em branco). */
export function openPresenca(detail: PresencaOpenDetail): void {
  window.dispatchEvent(new CustomEvent(PRESENCA_OPEN_EVENT, { detail }))
}
