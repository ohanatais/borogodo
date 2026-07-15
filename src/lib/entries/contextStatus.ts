import type { ContextStatus } from '@/types/entry'

/**
 * Deriva o estado de contexto de uma fonte (Story 2, feature 026) a partir de
 * `company`/`is_personal_project` — nunca uma coluna de enum própria (ver data-model.md).
 *
 * `is_personal_project` tem prioridade: uma vez que a pessoa escolheu a pílula "Projeto
 * pessoal", o contexto está resolvido independentemente de `company` (FR-003 acceptance #3) —
 * mesmo num estado defensivo em que ambos os campos estejam preenchidos.
 */
export function deriveContextStatus(company: string | null, isPersonalProject: boolean): ContextStatus {
  if (isPersonalProject) return 'personal_project'
  if (company !== null) return 'company'
  return 'unresolved'
}
