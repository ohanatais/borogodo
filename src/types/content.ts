// Tipos da fundação de Geração de Conteúdo (Presença, 013).
// Reusados por 014 (hub) e 015 (refino de voz). Identificadores em inglês (constituição II).

export type DraftFormat = 'post' | 'impact_summary'
export type SeedType = 'entry' | 'theme' | 'project'
export type DraftStatus = 'generated' | 'edited' | 'copied' | 'discarded'
export type VoiceFeedback = 'soa' | 'nao_soa'
export type LengthPref = 'curto' | 'medio' | 'longo'

/** Chips de ajuste rápido (US3) — regeram o rascunho mantendo a evidência. */
export type AdjustKind = 'mais_curto' | 'menos_formal' | 'tira_jargao'

/** Uma das 2 variações geradas por chamada. Forma exposta à UI (camelCase). */
export interface DraftVariant {
  angle: string
  body: string
  evidenceRefs: string[]
}

/**
 * Rascunho persistido (`drafts`). Em camelCase de leitura para a UI; o id interno
 * só vaza o necessário para o cliente operar o próprio rascunho (constituição I).
 */
export interface Draft {
  id: string
  format: DraftFormat
  seedType: SeedType
  seedRef: string | null
  angle: string
  body: string
  status: DraftStatus
  voiceFeedback: VoiceFeedback | null
  createdAt: string
}

/**
 * Perfil de voz por usuário (`profiles.voice_profile` JSONB, 1:1).
 * `inferredSummary` é a síntese cacheada da voz a partir do `raw_content` das capturas;
 * `samples` são 0 a 2 textos colados (refino opcional). Calibração híbrida = funde os dois.
 */
export interface VoiceProfile {
  tone?: string
  lengthPref?: LengthPref
  samples: string[]
  inferredSummary?: string
  updatedAt: string
}

/** Violação anti-IA detectada pelo ruleset determinístico (espelha `RulesetViolation` do espelho). */
export interface ContentRulesetViolation {
  assert: number
  field: string
  message: string
}
