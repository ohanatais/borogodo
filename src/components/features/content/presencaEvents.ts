import type { DraftFormat, DraftStatus, SeedType } from '@/types/content'

// Contrato do evento que abre a superfície de geração. Mantido num módulo sem JSX para que o ponto
// de entrada (UsarButton) e a superfície (GenerateSheet) compartilhem o tipo sem acoplar bundles.

export const PRESENCA_OPEN_EVENT = 'borogodo:presenca-open'

export interface PresencaOpenDetail {
  seedType: SeedType
  seedRef: string
  /** Texto curto da evidência base, mostrado como "Baseado em:". */
  seedSummary: string
  /** Formatos oferecidos: tema → ['post', 'mini_bio']; entrada → ['post', 'impact_summary']. */
  formats: DraftFormat[]
}

/** Dispara a abertura da superfície de geração com a evidência carregada (nunca página em branco). */
export function openPresenca(detail: PresencaOpenDetail): void {
  window.dispatchEvent(new CustomEvent(PRESENCA_OPEN_EVENT, { detail }))
}

// ─── Retomar (014) ────────────────────────────────────────────────────────────
// Reabrir um rascunho já salvo na superfície de edição, com body/ângulo preservados — sem regerar
// (FR-004). Evento separado para o GenerateSheet distinguir "gerar do zero" de "editar o que existe".

export const PRESENCA_RESUME_EVENT = 'borogodo:presenca-resume'

export interface PresencaResumeDetail {
  /** Id do rascunho existente — edições/cópia fazem PATCH neste id, sem criar linha nova. */
  draftId: string
  format: DraftFormat
  seedType: SeedType
  seedRef: string
  angle: string
  body: string
  /** Texto curto da evidência base, mostrado como "Baseado em:". */
  seedSummary: string
}

/** Reabre um rascunho salvo no fluxo de edição da 013, sem regeração automática. */
export function resumePresenca(detail: PresencaResumeDetail): void {
  window.dispatchEvent(new CustomEvent(PRESENCA_RESUME_EVENT, { detail }))
}

// ─── Rascunho atualizado (014) ─────────────────────────────────────────────────
// O editor (GenerateSheet/DraftCard) é montado fora do hub e grava no banco direto. Este evento
// avisa o hub para sincronizar a lista (preview) e o que o "retomar" reabre — sem isso, editar um
// rascunho não refletia até um reload completo.

export const PRESENCA_DRAFT_UPDATED_EVENT = 'borogodo:presenca-draft-updated'

export interface DraftUpdatedDetail {
  id: string
  body?: string
  status?: DraftStatus
}

/** Notifica o hub que um rascunho foi editado/copiado, para ele atualizar o item correspondente. */
export function notifyDraftUpdated(detail: DraftUpdatedDetail): void {
  window.dispatchEvent(new CustomEvent(PRESENCA_DRAFT_UPDATED_EVENT, { detail }))
}
