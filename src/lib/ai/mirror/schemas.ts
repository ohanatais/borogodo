import { z } from 'zod'
import type { Mirror } from '@/types/mirror'

const mirrorSectionSchema = z.object({
  headline: z.string().min(1),
  evidence: z.string().min(1),
})

const mirrorSchema = z.object({
  intro: z.string().min(1),
  primary_strength: mirrorSectionSchema,
  invisible_skill: mirrorSectionSchema,
  context_pattern: mirrorSectionSchema,
  closing_question: z.string().min(1),
  strength_themes: z.array(z.string().min(1)).min(3).max(6),
})

/**
 * Valida o JSON bruto retornado pelo Sonnet antes de persistir o snapshot.
 * Lança se o shape não bate com o esperado — quem chama não persiste nada parcial.
 */
export function validateMirror(raw: unknown): Mirror {
  return mirrorSchema.parse(raw)
}
