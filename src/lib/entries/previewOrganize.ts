import { complete } from '@/lib/ai/client'
import { extractJSONBlock } from '@/lib/ai/extractJSON'
import { CAPTURE_ORGANIZE_SYSTEM_PROMPT, buildOrganizeUserPrompt } from '@/lib/ai/extraction/prompts/organize'
import { validateOrganizeResult, type OrganizeResult } from '@/lib/ai/extraction/schemas'
import { getTagVocabulary } from '@/lib/entries/highlightVocabulary'
import { logger } from '@/lib/log'
import type { createServerClient } from '@/lib/db/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

const MAX_TOKENS = 2048

export type PreviewOrganizeOutcome = { status: 'organized'; result: OrganizeResult } | { status: 'failed' }

export interface PreviewOrganizeInput {
  rawText: string
  company: string | null
  isPersonalProject: boolean
  entryDate: string | null
}

/**
 * "Organizar" dentro do Drawer, antes de salvar — a pessoa pediu (revisão de UX pós-implementação
 * da feature 026) o mesmo botão do protótipo, disponível já no rascunho, não só depois de salvar.
 * Reusa a MESMA extração de `organizeEntry` (prompt, schema, vocabulário de tags) mas sem entry
 * existente: não persiste nada, só devolve o resultado pra pré-preencher os campos manuais do
 * rascunho. A persistência real de destaques continua acontecendo só depois de salvar
 * (`organizeEntry`, US1 clique manual / US3 disparo assíncrono) — este preview nunca escreve no
 * banco, por isso não recebe (nem precisa de) um `entryId`.
 */
export async function previewOrganize(
  supabase: SupabaseServerClient,
  userId: string,
  input: PreviewOrganizeInput
): Promise<PreviewOrganizeOutcome> {
  try {
    const tagVocabulary = await getTagVocabulary(supabase, userId)

    const prompt = buildOrganizeUserPrompt(input.rawText, {
      company: input.company,
      isPersonalProject: input.isPersonalProject,
      entryDate: input.entryDate,
      tagVocabulary,
      existingHighlights: [],
    })

    const raw = await complete({
      role: 'extraction',
      action: 'organize',
      userId,
      system: CAPTURE_ORGANIZE_SYSTEM_PROMPT,
      user: prompt,
      maxTokens: MAX_TOKENS,
    })

    const result = validateOrganizeResult(extractJSONBlock(raw))
    return { status: 'organized', result }
  } catch (error: unknown) {
    logger.error('preview_organize_failed', {
      userId,
      message: error instanceof Error ? error.message : 'unknown error',
    })
    return { status: 'failed' }
  }
}
