import { z } from 'zod'
import type { PrepMoment } from '@/lib/content/intentions'

export interface Preparation {
  id: string
  moment: PrepMoment
  title: string
  body: string
  evidenceEntryIds: string[]
  createdAt: string
}

export const createPreparationSchema = z.object({
  moment: z.enum(['entrevista', 'review', 'salario']),
  body: z.string().trim().min(1).max(12000),
  evidenceEntryIds: z.array(z.string().uuid()).max(5).default([]).transform((ids) => [...new Set(ids)]),
})

export const preparationEventSchema = z.object({
  eventName: z.enum(['moment_selected', 'context_submitted', 'evidence_opened', 'preparation_saved', 'conversation_shared', 'conversation_summarized', 'response_feedback']),
  moment: z.enum(['entrevista', 'review', 'salario']).optional(),
  // Analytics must never become a second chat transcript. Keep this payload closed to
  // primitive, non-text values; event-specific enums are represented as booleans/numbers.
  properties: z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,48}$/), z.union([z.boolean(), z.number().finite()])).default({}),
})

export const shareConversationSchema = z.object({
  confirmed: z.literal(true),
  moment: z.enum(['entrevista', 'review', 'salario']).optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(30000),
  })).min(1).max(20),
})
