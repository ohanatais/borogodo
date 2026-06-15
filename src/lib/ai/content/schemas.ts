import { z } from 'zod'
import type { DraftFormat } from '@/types/content'

// Forma da saída do LLM por variante (snake_case = como o modelo devolve no JSON).
const draftVariantSchema = z.object({
  angle: z.string(),
  body: z.string().min(1),
  evidence_refs: z.array(z.string()).default([]),
})

// Exatamente 2 variantes por geração (FR-004; data-model). `.length(2)` rejeita 1 ou 3.
const draftOutputSchema = z.object({
  variants: z.array(draftVariantSchema).length(2),
})

// Um schema por formato (FR-008). Idênticos em v1; nomeados à parte para poderem divergir
// sem tocar no orquestrador caso post e resumo de impacto precisem de formas diferentes.
export const postDraftSchema = draftOutputSchema
export const impactSummaryDraftSchema = draftOutputSchema

export type DraftOutput = z.infer<typeof draftOutputSchema>
export type DraftOutputVariant = DraftOutput['variants'][number]

const SCHEMA_BY_FORMAT: Record<DraftFormat, typeof draftOutputSchema> = {
  post: postDraftSchema,
  impact_summary: impactSummaryDraftSchema,
}

/**
 * Valida o JSON bruto do Sonnet com o schema do formato. Lança em shape inválido —
 * quem chama não persiste nada parcial (constituição III).
 */
export function validateDraftOutput(raw: unknown, format: DraftFormat): DraftOutput {
  return SCHEMA_BY_FORMAT[format].parse(raw)
}
