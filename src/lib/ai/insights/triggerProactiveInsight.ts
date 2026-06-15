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
  metric: string | null
}

async function loadRecentEntries(admin: SupabaseAdmin, userId: string): Promise<InsightEntryRow[]> {
  const { data, error } = await admin
    .from('entries')
    .select('id, what_i_did, tags, impact, metric')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_ENTRIES)

  if (error) {
    throw new Error('Não foi possível carregar as entradas recentes')
  }

  return (data ?? []) as InsightEntryRow[]
}

/**
 * Sinal forte = a captura tem impacto OU métrica (decisão de produto, determinístico e testável).
 * É o gatilho do nudge "isso daria um post" — captura fraca (sem impacto/métrica) não dispara.
 */
function isStrongSignal(entry: InsightEntryRow): boolean {
  return Boolean(entry.impact?.trim()) || Boolean(entry.metric?.trim())
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
 * Gera, valida e persiste um insight proativo — preenche o stub no-op de 003. Roda fora do request
 * (service_role, sempre filtrando user_id). Parcimônia: no máximo um insight não-visto por vez.
 *
 * 014 (US4): quando a captura mais recente tem sinal forte (impacto/métrica), o nudge
 * `content_opportunity` tem **prioridade** e substitui o insight comum (decisão de produto) — é
 * determinístico (sem IA), com a entrada-origem em `entry_ids`. Sem sinal forte, cai no insight comum
 * (Haiku). Erros são logados (sem dados de usuário); nunca quebra a captura.
 */
export async function triggerProactiveInsight(userId: string): Promise<void> {
  const admin = getSupabaseAdmin()

  try {
    const unseenCount = await countUnseenInsights(admin, userId)
    if (unseenCount >= MAX_UNSEEN_INSIGHTS) return

    const entries = await loadRecentEntries(admin, userId)
    if (entries.length === 0) return

    const latest = entries[0]
    if (isStrongSignal(latest)) {
      await insertProactiveInsight(admin, {
        userId,
        type: 'content_opportunity',
        headline: latest.what_i_did,
        body: latest.impact?.trim() || latest.metric?.trim() || '',
        entryIds: [latest.id],
      })
      return
    }

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
