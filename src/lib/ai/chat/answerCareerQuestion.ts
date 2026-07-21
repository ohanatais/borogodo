import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { recordUsageAndMaybeAlert } from '@/lib/ai/client'
import { generateEmbedding, cosineSimilarity, parseEmbedding } from '@/lib/ai/embeddings'
import { getLatestSnapshot } from '@/lib/db/mirror'
import { getProfile } from '@/lib/db/profiles'
import { buildCareerChatSystemPrompt } from '@/lib/ai/chat/prompts/careerChat'
import { logger } from '@/lib/log'
import type { Entry, EntryHighlight } from '@/types/entry'
import type { PrepMoment } from '@/lib/content/intentions'
import type { createServerClient } from '@/lib/db/supabase/server'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export interface Citation {
  label: string
  entryId: string
  company: string | null
  date: string | null
  metric: string | null
  impact: string | null
  proofs: { type: 'url' | 'image'; value: string; label?: string }[]
}

export interface CorrectionAction {
  entryId: string
  fields: Record<string, string>
  action: 'update' | 'delete' | 'enrich'
}

export interface ChatContext {
  type: 'espelho' | 'historico' | 'empresa' | 'entry' | 'preparacao'
  entityId?: string
  /** Momento de preparação (017) quando type === 'preparacao'. */
  moment?: PrepMoment
}

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

export type ChatEntry = Entry & {
  embedding?: unknown
  entry_highlights?: Pick<EntryHighlight, 'title' | 'metric' | 'impact' | 'tags' | 'position'>[]
  evidences?: { type: 'url' | 'image'; value: string; label?: string }[]
}

const SEMANTIC_SEARCH_LIMIT = 200
const TOP_K = 5
const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 2048
const BLOCKS_START = '<BLOCKS>'
const BLOCKS_END = '</BLOCKS>'

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada')
  return new Anthropic({ apiKey })
}

async function findRelevantEntries(
  supabase: SupabaseServerClient,
  userId: string,
  queryEmbedding: number[]
): Promise<ChatEntry[]> {
  const { data } = await supabase
    .from('entries')
    .select('id, user_id, what_i_did, decision, learning, impact, metric, entry_date, tags, company, role_title, role_start, role_end, project_name, raw_content, source, created_at, updated_at, embedding, evidences, entry_highlights(title, metric, impact, tags, position)')
    .eq('user_id', userId)
    .not('embedding', 'is', null)
    .order('created_at', { ascending: false })
    .limit(SEMANTIC_SEARCH_LIMIT)

  if (!data || data.length === 0) return []

  return (data as ChatEntry[])
    .map((row) => ({ entry: row, score: cosineSimilarity(queryEmbedding, parseEmbedding(row.embedding) ?? []) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .map(({ entry }) => entry)
}

async function fetchCompanyEntries(
  supabase: SupabaseServerClient,
  userId: string,
  company: string
): Promise<ChatEntry[]> {
  const { data } = await supabase
    .from('entries')
    .select('id, user_id, what_i_did, decision, learning, impact, metric, entry_date, tags, company, role_title, role_start, role_end, project_name, raw_content, source, created_at, updated_at, evidences, entry_highlights(title, metric, impact, tags, position)')
    .eq('user_id', userId)
    .eq('company', company)
    .order('entry_date', { ascending: false })
    .limit(20)

  return (data ?? []) as ChatEntry[]
}

async function fetchEntryById(
  supabase: SupabaseServerClient,
  userId: string,
  entryId: string
): Promise<ChatEntry | null> {
  const { data } = await supabase
    .from('entries')
    .select('id, user_id, what_i_did, decision, learning, impact, metric, entry_date, tags, company, role_title, role_start, role_end, project_name, raw_content, source, created_at, updated_at, evidences, entry_highlights(title, metric, impact, tags, position)')
    .eq('id', entryId)
    .eq('user_id', userId)
    .maybeSingle()

  return (data as ChatEntry | null)
}

function buildCitations(entries: ChatEntry[]): Citation[] {
  return entries.map((e) => ({
    label: e.title ?? e.entry_highlights?.[0]?.title ?? e.what_i_did,
    entryId: e.id,
    company: e.company ?? null,
    date: e.entry_date ?? e.created_at.slice(0, 10),
    metric: e.entry_highlights?.find((item) => item.metric)?.metric ?? e.metric ?? null,
    impact: e.entry_highlights?.find((item) => item.impact)?.impact ?? e.impact ?? null,
    proofs: e.evidences ?? [],
  }))
}

interface BlocksPayload {
  followups?: string[]
  evidenceRefs?: string[]
  correction?: CorrectionAction
  insight?: {
    objective?: string
    themes?: string[]
    gaps?: string[]
  }
}

const conversationInsightSchema = z.object({
  objective: z.string().trim().min(1).max(180),
  themes: z.array(z.string().trim().min(1).max(80)).max(5).default([]),
  gaps: z.array(z.string().trim().min(1).max(120)).max(5).default([]),
})

async function recordConversationInsight(
  supabase: SupabaseServerClient,
  userId: string,
  context: ChatContext | undefined,
  history: ChatMessage[],
  blocks: BlocksPayload,
  evidenceCount: number
): Promise<void> {
  const insight = conversationInsightSchema.safeParse(blocks.insight)
  if (!insight.success) return
  const { error } = await supabase.from('preparation_events').insert({
    user_id: userId,
    event_name: 'conversation_summarized',
    moment: context?.type === 'preparacao' ? context.moment ?? null : null,
    properties: {
      evidence_count: evidenceCount,
      turn_count: history.filter((item) => item.role === 'user').length + 1,
      objective_present: insight.data.objective.length > 0,
      theme_count: insight.data.themes.length,
      gap_count: insight.data.gaps.length,
      preparation_mode: context?.type === 'preparacao',
    },
  })
  if (error) logger.error('conversation insight persistence failed', { code: error.code })
}

function parseBlocks(buffer: string): BlocksPayload {
  const endIdx = buffer.indexOf(BLOCKS_END)
  const json = endIdx !== -1 ? buffer.slice(0, endIdx).trim() : buffer.trim()
  if (!json) return {}
  try {
    const parsed: unknown = JSON.parse(json)
    if (parsed !== null && typeof parsed === 'object') {
      return parsed as BlocksPayload
    }
  } catch {
    logger.error('parseBlocks: JSON inválido no bloco estruturado', { raw: json.slice(0, 200) })
  }
  return {}
}

export interface StreamEvents {
  onDelta: (text: string) => void
  onDone: (citations: Citation[], suggestions: string[], correction?: CorrectionAction) => void
  onError: (message: string) => void
}

export async function answerCareerQuestion(
  supabase: SupabaseServerClient,
  userId: string,
  userMessage: string,
  history: ChatMessage[],
  context: ChatContext | undefined,
  events: StreamEvents
): Promise<void> {
  const retrievalQuery = context?.type === 'preparacao'
    ? [context.moment, ...history.filter((item) => item.role === 'user').slice(-3).map((item) => item.content), userMessage].join('\n').slice(-6000)
    : userMessage
  const [profile, latestMirror, queryEmbedding] = await Promise.all([
    getProfile(supabase, userId),
    getLatestSnapshot(supabase, userId),
    generateEmbedding(retrievalQuery),
  ])

  const [relevantEntries, companyEntries, correctionEntry] = await Promise.all([
    findRelevantEntries(supabase, userId, queryEmbedding),
    context?.type === 'empresa' && context.entityId
      ? fetchCompanyEntries(supabase, userId, context.entityId)
      : Promise.resolve<Entry[]>([]),
    context?.type === 'entry' && context.entityId
      ? fetchEntryById(supabase, userId, context.entityId)
      : Promise.resolve<Entry | null>(null),
  ])

  const systemPrompt = buildCareerChatSystemPrompt({
    profile,
    latestMirror,
    relevantEntries,
    companyEntries,
    correctionEntry,
    prepMoment: context?.type === 'preparacao' ? context.moment : undefined,
  })

  const apiMessages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const client = getAnthropicClient()

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: apiMessages,
  })

  const SAFE_TAIL = BLOCKS_START.length
  let pending = ''
  let inBlocks = false
  let blocksBuffer = ''

  let streamError: string | null = null
  try {
    for await (const event of stream) {
      if (event.type !== 'content_block_delta') continue
      if (event.delta.type !== 'text_delta') continue

      const chunk = event.delta.text

      if (inBlocks) {
        blocksBuffer += chunk
        continue
      }

      pending += chunk

      const markerIdx = pending.indexOf(BLOCKS_START)
      if (markerIdx !== -1) {
        const toSend = pending.slice(0, markerIdx).trimEnd()
        if (toSend) events.onDelta(toSend)
        blocksBuffer = pending.slice(markerIdx + BLOCKS_START.length)
        inBlocks = true
        continue
      }

      if (pending.length > SAFE_TAIL) {
        events.onDelta(pending.slice(0, pending.length - SAFE_TAIL))
        pending = pending.slice(pending.length - SAFE_TAIL)
      }
    }

    if (!inBlocks && pending) {
      events.onDelta(pending)
    }
  } catch (err: unknown) {
    // Não sai daqui direto: uma falha no meio do stream ainda consumiu tokens (o Anthropic cobra),
    // então tentamos registrar o uso abaixo antes de reportar o erro — senão o freio sub-conta.
    streamError = err instanceof Error ? err.message : 'Erro desconhecido'
  }

  // Registra o uso do chat para o freio de custo (023). O chat stream-a por fora do provider, então
  // recordamos aqui após o streaming (sucesso OU falha no meio), lendo o usage da mensagem final.
  // Best-effort: se nem o usage final vier (erro duro), loga e segue.
  try {
    const final = await stream.finalMessage()
    await recordUsageAndMaybeAlert({
      userId,
      action: 'chat',
      role: 'synthesis',
      model: MODEL,
      inputTokens: final.usage.input_tokens,
      outputTokens: final.usage.output_tokens,
    })
  } catch (err: unknown) {
    logger.error('chat usage record failed', { reason: err instanceof Error ? err.message : 'unknown' })
  }

  if (streamError) {
    events.onError(streamError)
    return
  }

  const blocks = parseBlocks(blocksBuffer)
  const suggestions = Array.isArray(blocks.followups) ? blocks.followups.filter((s): s is string => typeof s === 'string') : []
  const correction = blocks.correction
  const referenced = new Set(Array.isArray(blocks.evidenceRefs) ? blocks.evidenceRefs.filter((id): id is string => typeof id === 'string') : [])
  const sourceEntries = [...relevantEntries, ...companyEntries, ...(correctionEntry ? [correctionEntry] : [])]
  const uniqueSources = Array.from(new Map(sourceEntries.map((entry) => [entry.id, entry])).values())
  const citations = buildCitations(uniqueSources.filter((entry) => referenced.has(entry.id)))

  await recordConversationInsight(supabase, userId, context, history, blocks, citations.length)

  events.onDone(citations, suggestions, correction)
}
