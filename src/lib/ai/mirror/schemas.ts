import { z } from 'zod'
import type { Mirror } from '@/types/mirror'

const evidenceItemSchema = z.object({
  text: z.string().min(1),
  entry_ids: z.array(z.string()).default([]),
})

const mirrorSectionSchema = z.object({
  headline: z.string().min(1),
  evidence: evidenceItemSchema,
})

const skillTierSchema = z.enum(['Emergente', 'Consistente', 'Comprovada'])

const skillItemSchema = z.object({
  name: z.string().min(1),
  tier: skillTierSchema,
  evidence_text: z.string().default(''),
  entry_ids: z.array(z.string()).default([]),
})

const macroCategorySchema = z.object({
  name: z.string().min(1),
  skills: z.array(skillItemSchema).default([]),
})

const mirrorSchema = z.object({
  intro: z.string().min(1),
  primary_strength: mirrorSectionSchema,
  invisible_skill: mirrorSectionSchema,
  context_pattern: mirrorSectionSchema,
  closing: z.string().min(1),
  strength_themes: z.array(z.string().min(1)).min(3).max(6),
  categories: z.array(macroCategorySchema).optional().default([]),
})

/**
 * Valida o JSON bruto retornado pelo Sonnet antes de persistir o snapshot.
 * Lança se o shape não bate com o esperado — quem chama não persiste nada parcial.
 */
export function validateMirror(raw: unknown): Mirror {
  return mirrorSchema.parse(raw) as Mirror
}
