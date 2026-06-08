import { z } from 'zod'

const proactiveInsightDraftSchema = z.object({
  type: z.enum(['invisible_skill', 'emerging_pattern', 'connection', 'evidence_gap']),
  headline: z.string().min(1),
  body: z.string().min(1),
  entry_indexes: z.array(z.number().int().nonnegative()),
})

export type ProactiveInsightDraft = z.infer<typeof proactiveInsightDraftSchema>

/**
 * Valida o JSON bruto retornado pelo Haiku antes de persistir o insight.
 * Lança se o shape não bate com o esperado — quem chama não persiste nada parcial.
 */
export function validateProactiveInsightDraft(raw: unknown): ProactiveInsightDraft {
  return proactiveInsightDraftSchema.parse(raw)
}
