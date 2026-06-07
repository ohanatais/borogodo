import type { createServerClient } from '@/lib/db/supabase/server'
import type { CaptureContext } from '@/types/capture'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

const RECENT_ENTRIES_LIMIT = 5
const MAX_STRENGTH_THEMES = 6

async function loadStrengthThemes(supabase: SupabaseServerClient, userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('mirror_snapshots')
    .select('strength_themes')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const themes = (data as { strength_themes?: string[] } | null)?.strength_themes ?? []
  return themes.slice(0, MAX_STRENGTH_THEMES)
}

async function loadRecentSummaries(supabase: SupabaseServerClient, userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('entries')
    .select('what_i_did')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(RECENT_ENTRIES_LIMIT)

  return ((data as { what_i_did: string }[] | null) ?? []).map((entry) => entry.what_i_did)
}

async function loadEntryCount(supabase: SupabaseServerClient, userId: string): Promise<number> {
  const { count } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  return count ?? 0
}

/**
 * Monta o contexto compacto da pessoa para a chamada de captura.
 * Tolerante: `mirror_snapshots` só existe a partir da feature 004 — qualquer falha de
 * consulta cai num contexto mínimo, sem travar a captura.
 */
export async function buildCaptureContext(supabase: SupabaseServerClient, userId: string): Promise<CaptureContext> {
  try {
    const [strengthThemes, recentSummaries, entryCount] = await Promise.all([
      loadStrengthThemes(supabase, userId),
      loadRecentSummaries(supabase, userId),
      loadEntryCount(supabase, userId),
    ])

    return { strengthThemes, recentSummaries, entryCount }
  } catch {
    return { strengthThemes: [], recentSummaries: [], entryCount: 0 }
  }
}
