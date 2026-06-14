'use server'

import { createServerClient } from '@/lib/db/supabase/server'
import { saveMirrorFeedback } from '@/lib/db/mirror'

export async function submitMirrorFeedback(snapshotId: string, resonated: boolean): Promise<void> {
  const supabase = await createServerClient()
  await saveMirrorFeedback(supabase, snapshotId, { resonated })
}
