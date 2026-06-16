// Tipos da fundação de Geração de Conteúdo (Presença, 013).
// Reusados por 014 (hub) e 015 (refino de voz). Identificadores em inglês (constituição II).

export type DraftFormat = 'post' | 'impact_summary' | 'mini_bio'
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

/**
 * Sinal acumulado de "soa"/"nao_soa" dos rascunhos (013/014) — base para SUGERIR a recalibração de
 * voz (015), nunca para aplicá-la sozinha. `lastFeedbackAt` é o feedback mais recente (ISO), usado
 * para só sugerir quando há sinal novo desde a última recalibração (`voice_profile.updatedAt`).
 */
export interface VoiceSignal {
  soaCount: number
  naoSoaCount: number
  lastFeedbackAt: string | null
}

/** Violação anti-IA detectada pelo ruleset determinístico (espelha `RulesetViolation` do espelho). */
export interface ContentRulesetViolation {
  assert: number
  field: string
  message: string
}

// ─── Hub da Presença (014) ──────────────────────────────────────────────────

/**
 * Filtro de status da listagem do hub. `ativos` é o default e exclui os arquivados
 * (`discarded`); `copiados` e `arquivados` são recortes focados. Mapeado para a query no servidor.
 */
export type DraftStatusFilter = 'ativos' | 'copiados' | 'arquivados'

/** Uma página da listagem paginada de rascunhos (keyset por `created_at`). */
export interface DraftListPage {
  items: Draft[]
  /** Cursor opaco para a próxima página, ou `null` quando não há mais. */
  nextCursor: string | null
}
