// Tipos da fundação de Geração de Conteúdo (Presença, 013).
// Reusados por 014 (hub) e 015 (refino de voz). Identificadores em inglês (constituição II).

export type DraftFormat = 'post' | 'impact_summary' | 'mini_bio' | 'self_assessment'
// impact_summary saiu das opções oferecidas (021); permanece no enum/motor (FR-015).
export const NUDGE_FORMATS: DraftFormat[] = ['post']
export type AngleKind = 'study' | 'opinion'
export type SeedType = 'entry' | 'theme' | 'project' | 'period'
// 'draft' (019): a autoavaliação é ESCRITA pela pessoa, então nasce rascunho autorado — nunca
// 'generated' (ninguém gera). Depois segue o lifecycle existente ('copied'/'discarded').
export type DraftStatus = 'draft' | 'generated' | 'edited' | 'copied' | 'discarded'
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

// ─── Autoavaliação cockpit (019) ────────────────────────────────────────────

/** Tipo do passo-pra-frente. v1 entrega só o plano de ação; prep de 1:1 é fast-follow. */
export type ForwardStepKind = 'action_plan' | 'one_on_one_prep'

/**
 * Passo-pra-frente opcional (US2), persistido em `drafts.qa.forwardStep`. Única IA geradora da
 * feature → todo conteúdo deriva SÓ do `body` escrito pela pessoa; `anchoredOn` registra os
 * trechos-fonte citados (anti-invenção bloqueante antes de persistir — research D5).
 */
export interface ForwardStep {
  kind: ForwardStepKind
  /** Trechos do que a PESSOA escreveu que ancoram o plano (prova de não-invenção). */
  anchoredOn: string[]
  /** Quando kind = 'action_plan' (GROW Will + 70-20-10, uma ação de experiência). */
  actionPlan?: {
    area: string
    experienceAction: string
    commitmentQuestion: string
  }
  /** Quando kind = 'one_on_one_prep' (fast-follow). */
  talkingPoints?: string[]
  generatedAt: string
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
