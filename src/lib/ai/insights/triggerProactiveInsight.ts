import { getProvider } from '@/lib/ai/provider'
import { extractJSONBlock } from '@/lib/ai/extractJSON'
import {
  PROACTIVE_INSIGHT_SYSTEM_PROMPT,
  buildProactiveInsightPrompt,
} from '@/lib/ai/insights/prompts/proactiveInsight'
import { validateProactiveInsightDraft } from '@/lib/ai/insights/schemas'
import { getSupabaseAdmin } from '@/lib/db/supabaseAdmin'
import { countUnseenInsights, insertProactiveInsight } from '@/lib/db/insights'
import { errorMessage } from '@/lib/errors'
import { logger } from '@/lib/log'

const MAX_TOKENS = 512
const MAX_ENTRIES = 10
const MAX_UNSEEN_INSIGHTS = 1

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>

interface InsightEntryRow {
  id: string
  what_i_did: string
  tags: string[]
  impact: string | null
}

async function loadRecentEntries(admin: SupabaseAdmin, userId: string): Promise<InsightEntryRow[]> {
  const { data, error } = await admin
    .from('entries')
    .select('id, what_i_did, tags, impact')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_ENTRIES)

  if (error) {
    throw new Error('Não foi possível carregar as entradas recentes')
  }

  return (data ?? []) as InsightEntryRow[]
}

async function generateInsight(entries: InsightEntryRow[]) {
  const raw = await getProvider().complete({
    role: 'extraction',
    system: PROACTIVE_INSIGHT_SYSTEM_PROMPT,
    user: buildProactiveInsightPrompt(entries),
    maxTokens: MAX_TOKENS,
  })

  return validateProactiveInsightDraft(extractJSONBlock(raw))
}

/**
 * Gera (Haiku), valida e persiste um insight proativo — preenche o stub no-op de 003.
 * Roda fora do request (service_role, sempre filtrando user_id). Evita acumular mais de
 * um insight não visto: se já há um, não gera outro. Erros são logados (sem dados de
 * usuário); nunca quebra a captura.
 */
export async function triggerProactiveInsight(userId: string): Promise<void> {
  const admin = getSupabaseAdmin()

  try {
    const unseenCount = await countUnseenInsights(admin, userId)
    if (unseenCount >= MAX_UNSEEN_INSIGHTS) return

    const entries = await loadRecentEntries(admin, userId)
    if (entries.length === 0) return

    const draft = await generateInsight(entries)
    const entryIds = draft.entry_indexes
      .map((index) => entries[index]?.id)
      .filter((id): id is string => Boolean(id))

    await insertProactiveInsight(admin, {
      userId,
      type: draft.type,
      headline: draft.headline,
      body: draft.body,
      entryIds,
    })
  } catch (error: unknown) {
    logger.error('proactive insight generation failed', { message: errorMessage(error) })
  }
}
