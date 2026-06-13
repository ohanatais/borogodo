export type ProactiveInsightType =
  | 'invisible_skill'
  | 'emerging_pattern'
  | 'connection'
  | 'evidence_gap'

export interface ProactiveInsight {
  id: string
  user_id: string
  type: ProactiveInsightType
  headline: string
  body: string
  entry_ids: string[]
  seen: boolean
  generated_at: string
}
