import type { SourceOrganizationStatus } from '@/types/entry'

/**
 * Janela de tolerância (FR-030/FR-031) antes de tratar uma organização "em andamento" como
 * travada — mesmo valor usado pela guarda de concorrência de `POST /api/entries/[id]/organize`
 * (`contracts/organize.md`) e pelo disparo assíncrono (US3, `triggerOrganizeEntry`).
 */
export const ORGANIZING_TIMEOUT_MS = 60_000

/**
 * `true` quando `organizing_started_at` está setado e ainda dentro da janela de tolerância —
 * usado tanto para a guarda de concorrência (evitar duas chamadas simultâneas, manual + async)
 * quanto para derivar o estado transitório "organizando…" no card.
 */
export function isOrganizingRecently(startedAt: string | null, now: number = Date.now()): boolean {
  if (!startedAt) return false
  return now - new Date(startedAt).getTime() < ORGANIZING_TIMEOUT_MS
}

/**
 * Deriva o estado de organização de uma fonte (feature 026, US3) a partir de `organized_at`/
 * `organizing_started_at` — nunca uma coluna de enum própria (ver data-model.md).
 *
 * `organized_at` tem prioridade: uma vez organizada com sucesso, o estado é 'organized' mesmo que
 * `organizing_started_at` ainda esteja presente por algum motivo defensivo (normalmente
 * `organizeEntry` limpa os dois juntos). Uma organização "em andamento" há mais que
 * `ORGANIZING_TIMEOUT_MS` é tratada como travada/falha (FR-030) — cai de volta para
 * 'not_organized', permitindo nova tentativa em vez de ficar presa num estado transitório para
 * sempre.
 */
export function deriveOrganizationStatus(
  organizedAt: string | null,
  organizingStartedAt: string | null,
  now: number = Date.now()
): SourceOrganizationStatus {
  if (organizedAt !== null) return 'organized'
  if (isOrganizingRecently(organizingStartedAt, now)) return 'organizing'
  return 'not_organized'
}
