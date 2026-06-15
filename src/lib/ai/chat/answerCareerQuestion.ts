import Anthropic from '@anthropic-ai/sdk'
import { generateEmbedding, cosineSimilarity, parseEmbedding } from '@/lib/ai/embeddings'
import { getLatestSnapshot } from '@/lib/db/mirror'
import { getProfile } from '@/lib/db/profiles'
import { buildCareerChatSystemPrompt } from '@/lib/ai/chat/prompts/careerChat'
import type { Entry } from '@/types/entry'
import type { createServerClient } from '@/lib/db/supabase/server'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export interface Citation {
  label: string
  entryId: string
  company: string | null
  date: string | null
}

export interface ChatContext {
  type: 'espelho' | 'historico' | 'empresa' | 'entry'
  entityId?: string
}

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

type EntryWithEmbedding = Entry & { embedding: unknown }

const SEMANTIC_SEARCH_LIMIT = 200
const TOP_K = 5
const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 1024
const FOLLOWUP_START = '<FOLLOWUPS>'
const FOLLOWUP_END = '</FOLLOWUPS>'

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada')
  return new Anthropic({ apiKey })
}

async function findRelevantEntries(
  supabase: SupabaseServerClient,
  userId: string,
  queryEmbedding: number[]
): Promise<Entry[]> {
  const { data } = await supabase
    .from('entries')
    .select('id, user_id, what_i_did, decision, learning, impact, metric, entry_date, tags, company, role_title, role_start, role_end, project_name, raw_content, source, created_at, updated_at, embedding')
    .eq('user_id', userId)
    .not('embedding', 'is', null)
    .order('created_at', { ascending: false })
    .limit(SEMANTIC_SEARCH_LIMIT)

  if (!data || data.length === 0) return []

  return (data as EntryWithEmbedding[])
    .map((row) => ({ entry: row, score: cosineSimilarity(queryEmbedding, parseEmbedding(row.embedding) ?? []) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .map(({ entry }) => {
      const { embedding: _e, ...rest } = entry
      return rest as Entry
    })
}

async function fetchCompanyEntries(
  supabase: SupabaseServerClient,
  userId: string,
  company: string
): Promise<Entry[]> {
  const { data } = await supabase
    .from('entries')
    .select('id, user_id, what_i_did, decision, learning, impact, metric, entry_date, tags, company, role_title, role_start, role_end, project_name, raw_content, source, created_at, updated_at')
    .eq('user_id', userId)
    .eq('company', company)
    .order('entry_date', { ascending: false })
    .limit(20)

  return (data ?? []) as Entry[]
}

function buildCitations(entries: Entry[]): Citation[] {
  return entries.map((e) => ({
    label: e.what_i_did.slice(0, 60) + (e.what_i_did.length > 60 ? '...' : ''),
    entryId: e.id,
    company: e.company ?? null,
    date: e.entry_date ?? e.created_at.slice(0, 10),
  }))
}

function parseFollowups(buffer: string): string[] {
  const endIdx = buffer.indexOf(FOLLOWUP_END)
  const json = endIdx !== -1 ? buffer.slice(0, endIdx).trim() : buffer.trim()
  try {
    const parsed: unknown = JSON.parse(json)
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
      return parsed as string[]
    }
  } catch {
    // ignore parse errors
  }
  return []
}

export interface StreamEvents {
  onDelta: (text: string) => void
  onDone: (citations: Citation[], suggestions: string[]) => void
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
  const [profile, latestMirror, queryEmbedding] = await Promise.all([
    getProfile(supabase, userId),
    getLatestSnapshot(supabase, userId),
    generateEmbedding(userMessage),
  ])

  const relevantEntries = await findRelevantEntries(supabase, userId, queryEmbedding)

  let companyEntries: Entry[] = []
  if (context?.type === 'empresa' && context.entityId) {
    companyEntries = await fetchCompanyEntries(supabase, userId, context.entityId)
  }

  const systemPrompt = buildCareerChatSystemPrompt({
    profile,
    latestMirror,
    relevantEntries,
    companyEntries,
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

  // Buffer to detect FOLLOWUPS marker across chunk boundaries
  const SAFE_TAIL = FOLLOWUP_START.length
  let pending = ''
  let inFollowups = false
  let followupsBuffer = ''

  try {
    for await (const event of stream) {
      if (event.type !== 'content_block_delta') continue
      if (event.delta.type !== 'text_delta') continue

      const chunk = event.delta.text

      if (inFollowups) {
        followupsBuffer += chunk
        continue
      }

      pending += chunk

      const markerIdx = pending.indexOf(FOLLOWUP_START)
      if (markerIdx !== -1) {
        const toSend = pending.slice(0, markerIdx).trimEnd()
        if (toSend) events.onDelta(toSend)
        followupsBuffer = pending.slice(markerIdx + FOLLOWUP_START.length)
        inFollowups = true
        continue
      }

      // Send everything except the last SAFE_TAIL chars (in case marker spans chunks)
      if (pending.length > SAFE_TAIL) {
        events.onDelta(pending.slice(0, pending.length - SAFE_TAIL))
        pending = pending.slice(pending.length - SAFE_TAIL)
      }
    }

    // Flush remaining pending text (no marker found)
    if (!inFollowups && pending) {
      events.onDelta(pending)
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    events.onError(message)
    return
  }

  const suggestions = parseFollowups(followupsBuffer)
  const citations = buildCitations(relevantEntries)
  events.onDone(citations, suggestions)
}
