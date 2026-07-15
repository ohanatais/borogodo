import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { organizeEntry } from '@/lib/entries/organizeEntry'
import { logger } from '@/lib/log'

// FR-031: janela de tolerância antes de tratar uma organização "em andamento" como travada e
// permitir nova tentativa (contracts/organize.md).
const CONCURRENCY_TIMEOUT_MS = 60_000

interface RouteContext {
  params: Promise<{ id: string }>
}

interface OrganizingStateRow {
  organizing_started_at: string | null
}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

function isRecentlyStarted(startedAt: string | null): boolean {
  if (!startedAt) return false
  return Date.now() - new Date(startedAt).getTime() < CONCURRENCY_TIMEOUT_MS
}

/**
 * `POST /api/entries/[id]/organize` (US1, feature 026) — dispara o clique manual em "Organizar".
 * Guarda de concorrência (FR-031) evita duas chamadas de IA simultâneas por duplo clique; a
 * chamada em si (Haiku, validação, persistência "só preenche vazios") vive em `organizeEntry`.
 * Falha de IA nunca vira 5xx (FR-030) — o único 5xx aqui seria erro de infra ao ler o registro.
 */
export async function POST(_request: Request, context: RouteContext): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('Não autorizado', 401)

  const { id } = await context.params

  const { data, error } = await supabase
    .from('entries')
    .select('organizing_started_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return jsonError('Erro ao carregar registro', 500)
  if (!data) return jsonError('Registro não encontrado', 404)

  const { organizing_started_at } = data as OrganizingStateRow

  if (isRecentlyStarted(organizing_started_at)) {
    return NextResponse.json({ status: 'already_organizing' })
  }

  const { error: lockError } = await supabase
    .from('entries')
    .update({ organizing_started_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (lockError) {
    logger.error('organize_lock_write_failed', { entryId: id })
  }

  const result = await organizeEntry(supabase, user.id, id)

  if (result.status === 'not_found') return jsonError('Registro não encontrado', 404)

  return NextResponse.json(result)
}
