export interface MirrorSection {
  headline: string
  evidence: string
}

export interface Mirror {
  intro: string
  primary_strength: MirrorSection
  invisible_skill: MirrorSection
  context_pattern: MirrorSection
  closing_question: string
  strength_themes: string[]
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
