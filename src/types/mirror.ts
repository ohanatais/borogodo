export interface EvidenceItem {
  text: string
  entry_ids: string[]
}

/** Normaliza evidência legada (string) para o novo formato { text, entry_ids }. */
export function toEvidenceItem(raw: unknown): EvidenceItem {
  if (typeof raw === 'string') return { text: raw, entry_ids: [] }
  if (raw && typeof raw === 'object' && 'text' in raw) {
    const ev = raw as { text: unknown; entry_ids?: unknown }
    return {
      text: typeof ev.text === 'string' ? ev.text : '',
      entry_ids: Array.isArray(ev.entry_ids) ? (ev.entry_ids as string[]) : [],
    }
  }
  return { text: '', entry_ids: [] }
}

export type SkillTier = 'Emergente' | 'Consistente' | 'Comprovada'

export interface SkillItem {
  name: string
  tier: SkillTier
  evidence_text: string
  entry_ids: string[]
}

export interface MacroCategory {
  name: string
  skills: SkillItem[]
}

export interface MirrorSection {
  headline: string
  evidence: EvidenceItem
}

export interface Mirror {
  intro: string
  primary_strength: MirrorSection
  invisible_skill: MirrorSection
  context_pattern: MirrorSection
  closing: string
  strength_themes: string[]
  categories?: MacroCategory[]
}

export interface MirrorSnapshot {
  id: string
  user_id: string
  mirror: Mirror
  primary_strength: MirrorSection
  strength_themes: string[]
  entry_count: number
  generated_at: string
  resonated: boolean | null
  feedback_text: string | null
}
