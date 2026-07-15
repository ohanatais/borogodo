// 'deposito' (025-registro-deposito): salvamento direto do drawer, sem chamada de IA no caminho
// crítico — ver data-model.md da feature.
export type EntrySource = 'linkedin_pdf' | 'audio' | 'text' | 'chips' | 'image' | 'deposito'

export interface ExtractedEntry {
  what_i_did: string
  decision?: string | null
  learning?: string | null
  impact?: string | null
  metric?: string | null
  entry_date?: string | null
  tags: string[]
  company?: string | null
  role_title?: string | null
  role_start?: string | null
  role_end?: string | null
  project_name?: string | null
  raw_content: string
  source: EntrySource
  title?: string | null
  file_name?: string | null
}

export interface Entry extends ExtractedEntry {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

// Feature 026-organizar-destaques: um registro (fonte) passa a agrupar um ou mais destaques.
// Ver specs/026-organizar-destaques/data-model.md para o raciocínio completo do schema.

/** Um destaque dentro de uma fonte (`entries`) — métrica/impacto/tags/título são por destaque. */
export interface EntryHighlight {
  id: string
  entry_id: string
  user_id: string
  title: string | null
  metric: string | null
  impact: string | null
  tags: string[]
  position: number
  created_at: string
  updated_at: string
}

/**
 * Estado de organização de uma fonte, derivado de `organized_at`/`organizing_started_at`
 * (não é uma coluna de enum — ver data-model.md).
 */
export type SourceOrganizationStatus = 'not_organized' | 'organizing' | 'organized'

/**
 * Estado de contexto de uma fonte, derivado de `company`/`is_personal_project`
 * (não é uma coluna de enum — ver data-model.md).
 */
export type ContextStatus = 'unresolved' | 'company' | 'personal_project'
