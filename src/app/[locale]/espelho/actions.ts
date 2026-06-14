'use server'

import { createServerClient } from '@/lib/db/supabase/server'
import { saveMirrorFeedback } from '@/lib/db/mirror'
import { getEntriesByIds } from '@/lib/db/entries'
import type { Entry } from '@/types/entry'

export async function submitMirrorFeedback(snapshotId: string, resonated: boolean): Promise<void> {
  const supabase = await createServerClient()
  await saveMirrorFeedback(supabase, snapshotId, { resonated })
}

export async function getEvidenceEntries(entryIds: string[]): Promise<Entry[]> {
  if (entryIds.length === 0) return []

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  return getEntriesByIds(supabase, user.id, entryIds)
}
