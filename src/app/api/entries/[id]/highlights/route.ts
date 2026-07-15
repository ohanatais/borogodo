import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

interface EntryOwnershipRow {
  id: string
}

interface LastPositionRow {
  position: number
}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

async function loadOwnedEntry(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  entryId: string,
  userId: string
): Promise<EntryOwnershipRow | null> {
  const { data } = await supabase
    .from('entries')
    .select('id')
    .eq('id', entryId)
    .eq('user_id', userId)
    .maybeSingle()

  return (data as EntryOwnershipRow | null) ?? null
}

/**
 * `GET /api/entries/[id]/highlights` (US4, feature 026) — lista os destaques de uma fonte,
 * ordenados por `position`. Usado pelo card de fonte para renderizar um `HighlightCard` por
 * destaque (FR-015/FR-017) sem depender do join ainda pendente em `getFeedData` (escopo de US7).
 */
export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('Não autorizado', 401)

  const { id } = await context.params

  const entry = await loadOwnedEntry(supabase, id, user.id)
  if (!entry) return jsonError('Registro não encontrado', 404)

  const { data, error } = await supabase
    .from('entry_highlights')
    .select('*')
    .eq('entry_id', id)
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  if (error) return jsonError('Erro ao carregar destaques', 500)

  return NextResponse.json({ highlights: data ?? [] })
}

/**
 * `POST /api/entries/[id]/highlights` (US4, FR-016) — cria um destaque em branco dentro de uma
 * fonte existente, independente de a organização por IA já ter rodado. `position` é sempre o
 * último + 1 (destaques gerados pela IA ou adicionados manualmente convivem na mesma ordenação).
 */
export async function POST(_request: Request, context: RouteContext): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('Não autorizado', 401)

  const { id } = await context.params

  const entry = await loadOwnedEntry(supabase, id, user.id)
  if (!entry) return jsonError('Registro não encontrado', 404)

  const { data: lastRows, error: lastError } = await supabase
    .from('entry_highlights')
    .select('position')
    .eq('entry_id', id)
    .order('position', { ascending: false })
    .limit(1)

  if (lastError) return jsonError('Erro ao calcular posição do destaque', 500)

  const lastPosition = (lastRows as LastPositionRow[] | null)?.[0]?.position ?? -1

  const { data: created, error: insertError } = await supabase
    .from('entry_highlights')
    .insert({
      entry_id: id,
      user_id: user.id,
      title: null,
      metric: null,
      impact: null,
      tags: [],
      position: lastPosition + 1,
    })
    .select()
    .maybeSingle()

  if (insertError || !created) return jsonError('Erro ao criar destaque', 500)

  return NextResponse.json({ highlight: created }, { status: 201 })
}
