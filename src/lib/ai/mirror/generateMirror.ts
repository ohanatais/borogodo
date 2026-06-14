import { getProvider } from '@/lib/ai/provider'
import { extractJSONBlock } from '@/lib/ai/extractJSON'
import { MIRROR_SYSTEM_PROMPT, buildMirrorUserPrompt } from '@/lib/ai/mirror/prompts/firstMirror'
import { validateMirror } from '@/lib/ai/mirror/schemas'
import { insertMirrorSnapshot } from '@/lib/db/mirror'
import { NoEntriesError } from '@/lib/errors'
import { getMirrorStatus } from '@/lib/panel/getMirrorStatus'
import type { createServerClient } from '@/lib/db/supabase/server'
import type { Mirror, MirrorSnapshot, EvidenceItem } from '@/types/mirror'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

const MAX_TOKENS = 2048
const MAX_ENTRIES = 20
const FALLBACK_NAME = 'você'

interface MirrorEntryRow {
  id: string
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
    .select('id, what_i_did, company, role_title, tags, impact, metric')
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

/** Substitui rótulos sequenciais (E1, E2…) pelos UUIDs reais. Qualquer label fora do mapa é descartado. */
function resolveEntryIds(ids: string[], entryMap: Map<string, string>): string[] {
  return ids.map((label) => entryMap.get(label) ?? '').filter((id) => id.length > 0)
}

/** Percorre recursivamente o Mirror resolvendo entry_ids em EvidenceItems e SkillItems. */
function resolveAllEntryIds(mirror: Mirror, entryMap: Map<string, string>): Mirror {
  function resolveEvidence(ev: EvidenceItem): EvidenceItem {
    return { ...ev, entry_ids: resolveEntryIds(ev.entry_ids, entryMap) }
  }

  return {
    ...mirror,
    primary_strength: {
      ...mirror.primary_strength,
      evidence: resolveEvidence(mirror.primary_strength.evidence),
    },
    invisible_skill: {
      ...mirror.invisible_skill,
      evidence: resolveEvidence(mirror.invisible_skill.evidence),
    },
    context_pattern: {
      ...mirror.context_pattern,
      evidence: resolveEvidence(mirror.context_pattern.evidence),
    },
    categories: mirror.categories?.map((cat) => ({
      ...cat,
      skills: cat.skills.map((skill) => ({
        ...skill,
        entry_ids: resolveEntryIds(skill.entry_ids, entryMap),
      })),
    })),
  }
}

async function generateMirror(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ mirror: Mirror; entryCount: number }> {
  const entries = await loadEntries(supabase, userId)
  const userName = await loadUserName(supabase, userId)

  const status = getMirrorStatus(entries.length)

  // Mapa label → UUID para resolver entry_ids após geração
  const entryMap = new Map<string, string>()
  entries.forEach((e, i) => entryMap.set(`E${i + 1}`, e.id))

  const raw = await getProvider().complete({
    role: 'synthesis',
    system: MIRROR_SYSTEM_PROMPT,
    user: buildMirrorUserPrompt(entries, userName, status),
    maxTokens: MAX_TOKENS,
  })

  const parsed = validateMirror(extractJSONBlock(raw))
  const mirror = resolveAllEntryIds(parsed, entryMap)

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
