import type { Draft, DraftFormat, DraftStatus, SeedType, VoiceFeedback } from '@/types/content'

// Wrappers de fetch client-side das rotas de persistência (US4). Mantidos num módulo sem JSX para
// que DraftCard (geração) e a página /presenca compartilhem o mesmo caminho sem duplicar fetch.

export interface CreateDraftInput {
  format: DraftFormat
  seedType: SeedType
  seedRef: string | null
  angle: string
  body: string
  status: Extract<DraftStatus, 'generated' | 'edited'>
  qa: Record<string, unknown>
}

export interface PatchDraftInput {
  body?: string
  status?: DraftStatus
  voiceFeedback?: VoiceFeedback
}

/** Persiste um rascunho escolhido. Devolve o Draft com `id` ou `null` em falha (a UI não quebra). */
export async function createDraft(input: CreateDraftInput): Promise<Draft | null> {
  try {
    const res = await fetch('/api/content/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { draft: Draft }
    return data.draft
  } catch {
    return null
  }
}

/** Atualiza body/status/voiceFeedback de um rascunho já persistido. `null` em 404/falha. */
export async function patchDraft(id: string, input: PatchDraftInput): Promise<Draft | null> {
  try {
    const res = await fetch(`/api/content/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { draft: Draft }
    return data.draft
  } catch {
    return null
  }
}
