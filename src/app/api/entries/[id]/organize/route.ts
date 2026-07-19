import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { organizeEntry } from '@/lib/entries/organizeEntry'
import { tryAcquireOrganizingLock } from '@/lib/entries/organizingLock'
import { fireAndForget, maybeRegenerateMirror, refreshEntryEmbedding } from '@/lib/ai/extraction/jobs'

interface RouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * `POST /api/entries/[id]/organize` (US1, feature 026) — dispara o clique manual em "Organizar".
 * Guarda de concorrência (FR-031) evita duas chamadas de IA simultâneas — tanto por duplo
 * clique quanto pela corrida com o disparo assíncrono do salvar (US3) — via
 * `tryAcquireOrganizingLock` (UPDATE condicional atômico, não um read-then-write). A chamada em
 * si (Haiku, validação, persistência "só preenche vazios") vive em `organizeEntry`. Falha de IA
 * nunca vira 5xx (FR-030) — o único 5xx aqui seria erro de infra ao adquirir o lock.
 */
export async function POST(_request: Request, context: RouteContext): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('Não autorizado', 401)

  const { id } = await context.params

  let lock: Awaited<ReturnType<typeof tryAcquireOrganizingLock>>
  try {
    lock = await tryAcquireOrganizingLock(supabase, id, user.id)
  } catch {
    return jsonError('Erro ao carregar registro', 500)
  }

  if (lock === 'not_found') return jsonError('Registro não encontrado', 404)
  if (lock === 'already_organizing') return NextResponse.json({ status: 'already_organizing' })

  const result = await organizeEntry(supabase, user.id, id)

  if (result.status === 'not_found') return jsonError('Registro não encontrado', 404)
  if (result.status === 'organized') {
    fireAndForget('maybeRegenerateMirror', maybeRegenerateMirror(user.id))
    fireAndForget('refreshEntryEmbedding', refreshEntryEmbedding(user.id, id))
  }

  return NextResponse.json(result)
}
