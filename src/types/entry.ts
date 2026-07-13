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
