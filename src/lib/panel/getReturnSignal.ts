export type ReturnSignalType = 'welcome' | 'has-new' | 'old-victory'

export interface ReturnSignalEntry {
  id: string
  what_i_did: string
  entry_date: string | null
  created_at: string
}

export interface ReturnSignal {
  type: ReturnSignalType
  strengthAha: boolean
  entry: ReturnSignalEntry | null
}

interface GetReturnSignalInput {
  entries: ReturnSignalEntry[]
  lastPanelSeenAt: string | null
  latestMirrorGeneratedAt: string | null
  lastMirrorSeenAt: string | null
}

export function getReturnSignal({
  entries,
  lastPanelSeenAt,
  latestMirrorGeneratedAt,
  lastMirrorSeenAt,
}: GetReturnSignalInput): ReturnSignal {
  if (entries.length === 0) {
    return { type: 'welcome', strengthAha: false, entry: null }
  }

  const seenTs = lastPanelSeenAt ? new Date(lastPanelSeenAt).getTime() : 0
  const newEntries = entries.filter((e) => new Date(e.created_at).getTime() > seenTs)

  if (newEntries.length > 0) {
    const mirrorTs = latestMirrorGeneratedAt
      ? new Date(latestMirrorGeneratedAt).getTime()
      : 0
    const mirrorSeenTs = lastMirrorSeenAt ? new Date(lastMirrorSeenAt).getTime() : 0
    const strengthAha = mirrorTs > 0 && mirrorTs > mirrorSeenTs && mirrorTs > seenTs

    const entry = newEntries[0] ?? null
    return { type: 'has-new', strengthAha, entry }
  }

  // No new entries — surface the oldest one for anniversary feel
  const sorted = [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const oldest = sorted[0] ?? null

  return { type: 'old-victory', strengthAha: false, entry: oldest }
}
