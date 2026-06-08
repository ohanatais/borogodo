import { getProvider } from '@/lib/ai/provider'
import { extractJSONBlock } from '@/lib/ai/extractJSON'
import { MIRROR_SYSTEM_PROMPT, buildMirrorUserPrompt } from '@/lib/ai/mirror/prompts/firstMirror'
import { validateMirror } from '@/lib/ai/mirror/schemas'
import { insertMirrorSnapshot } from '@/lib/db/mirror'
import { NoEntriesError } from '@/lib/errors'
import type { createServerClient } from '@/lib/db/supabase/server'
import type { Mirror, MirrorSnapshot } from '@/types/mirror'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

const MAX_TOKENS = 2048
const MAX_ENTRIES = 20
const FALLBACK_NAME = 'você'

interface MirrorEntryRow {
  what_i_did: string
  company: string | null
  role_title: string | null
  tags: string[]
  impact: string | null
  metric: string | null
}

async function loadEntries(supabase: SupabaseServerClient, userId: string): Promise<MirrorEntryRow[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('what_i_did, company, role_title, tags, impact, metric')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_ENTRIES)

  if (error) {
    throw new Error('Não foi possível carregar as entradas')
  }

  if (!data?.length) {
    throw new NoEntriesError()
  }

  return data as MirrorEntryRow[]
}

async function loadUserName(supabase: SupabaseServerClient, userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle()
  const firstName = (data as { name?: string | null } | null)?.name?.trim().split(' ')[0]

  return firstName || FALLBACK_NAME
}

async function generateMirror(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ mirror: Mirror; entryCount: number }> {
  const entries = await loadEntries(supabase, userId)
  const userName = await loadUserName(supabase, userId)

  const raw = await getProvider().complete({
    role: 'synthesis',
    system: MIRROR_SYSTEM_PROMPT,
    user: buildMirrorUserPrompt(entries, userName),
    maxTokens: MAX_TOKENS,
  })

  const mirror = validateMirror(extractJSONBlock(raw))

  return { mirror, entryCount: entries.length }
}

/**
 * Gera (Sonnet), valida e persiste o espelho do usuário — usado tanto na primeira geração
 * (rota `/api/mirror/generate`) quanto na regeneração por limiar (`maybeRegenerateMirror`).
 * Contexto restrito ao próprio usuário; nada parcial é persistido se a validação falhar.
 */
export async function generateAndSaveMirror(
  supabase: SupabaseServerClient,
  userId: string
): Promise<MirrorSnapshot> {
  const { mirror, entryCount } = await generateMirror(supabase, userId)

  return insertMirrorSnapshot(supabase, { userId, mirror, entryCount })
}
