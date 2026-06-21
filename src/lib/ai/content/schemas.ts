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
// sem tocar no orquestrador caso os formatos precisem de formas diferentes.
export const postDraftSchema = draftOutputSchema
export const impactSummaryDraftSchema = draftOutputSchema
// Mini-bio (015): mesma forma (2 variantes); a disciplina de "curta + factual + sem clichê" vem do
// prompt e do ruleset (assert 10), não da forma. Nomeado à parte para divergir sem tocar no motor.
export const miniBioDraftSchema = draftOutputSchema

export type DraftOutput = z.infer<typeof draftOutputSchema>
export type DraftOutputVariant = DraftOutput['variants'][number]

// 019: 'self_assessment' deixou de ser um formato GERADO (modelo cockpit — a pessoa escreve, a IA só
// ancora). Por isso não tem schema de saída de LLM aqui; segue apenas como formato persistido em `drafts`.
const SCHEMA_BY_FORMAT: Partial<Record<DraftFormat, typeof draftOutputSchema>> = {
  post: postDraftSchema,
  impact_summary: impactSummaryDraftSchema,
  mini_bio: miniBioDraftSchema,
}

/**
 * Valida o JSON bruto do Sonnet com o schema do formato. Lança em shape inválido — quem chama não
 * persiste nada parcial (constituição III). Formato sem geração (ex.: self_assessment) também lança.
 */
export function validateDraftOutput(raw: unknown, format: DraftFormat): DraftOutput {
  const schema = SCHEMA_BY_FORMAT[format]
  if (!schema) throw new Error(`Formato '${format}' não é gerado por LLM (sem schema de saída).`)
  return schema.parse(raw)
}
