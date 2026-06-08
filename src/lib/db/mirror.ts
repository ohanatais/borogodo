import type { createServerClient } from '@/lib/db/supabase/server'
import type { Mirror, MirrorSnapshot } from '@/types/mirror'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

interface InsertMirrorSnapshotInput {
  userId: string
  mirror: Mirror
  entryCount: number
}

export async function insertMirrorSnapshot(
  supabase: SupabaseServerClient,
  { userId, mirror, entryCount }: InsertMirrorSnapshotInput
): Promise<MirrorSnapshot> {
  const { data, error } = await supabase
    .from('mirror_snapshots')
    .insert({
      user_id: userId,
      mirror,
      primary_strength: mirror.primary_strength,
      strength_themes: mirror.strength_themes,
      entry_count: entryCount,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error('Não foi possível salvar o espelho')
  }

  return data as MirrorSnapshot
}

export async function getLatestSnapshot(
  supabase: SupabaseServerClient,
  userId: string
): Promise<MirrorSnapshot | null> {
  const { data, error } = await supabase
    .from('mirror_snapshots')
    .select()
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as MirrorSnapshot
}

interface MirrorFeedbackInput {
  resonated: boolean
  feedbackText?: string | null
}

export async function saveMirrorFeedback(
  supabase: SupabaseServerClient,
  snapshotId: string,
  { resonated, feedbackText }: MirrorFeedbackInput
): Promise<MirrorSnapshot | null> {
  const { data, error } = await supabase
    .from('mirror_snapshots')
    .update({ resonated, feedback_text: feedbackText ?? null })
    .eq('id', snapshotId)
    .select()
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as MirrorSnapshot
}
