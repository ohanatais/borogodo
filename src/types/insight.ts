export type ProactiveInsightType =
  | 'invisible_skill'
  | 'emerging_pattern'
  | 'connection'
  | 'evidence_gap'
  // 014: nudge "isso daria um post" disparado por captura forte. `type` é texto livre no banco
  // (sem CHECK), então não há migration — só este valor novo no union de aplicação.
  | 'content_opportunity'
  // 016: pergunta cirúrgica assíncrona para enriquecer entrada magra (sem metric/impact).
  | 'enrichment_nudge'

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
