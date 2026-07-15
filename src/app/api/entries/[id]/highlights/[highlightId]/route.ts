import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { rollupEntryTags } from '@/lib/entries/rollupEntryTags'

interface RouteContext {
  params: Promise<{ id: string; highlightId: string }>
}

const updateHighlightSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  metric: z.string().max(200).nullable().optional(),
  impact: z.string().max(1000).nullable().optional(),
  tags: z.array(z.string().max(60)).optional(),
})

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * `PATCH /api/entries/[id]/highlights/[highlightId]` (US4, FR-015) — edita os campos de UM
 * destaque. O filtro por `id`/`entry_id`/`user_id` garante isolamento por linha: nunca afeta os
 * demais destaques da mesma fonte nem a fonte em si. Recalcula o rollup de tags (`entries.tags`)
 * só quando `tags` foi de fato enviado no body.
 */
export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('Não autorizado', 401)

  const { id, highlightId } = await context.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('Body inválido', 400)
  }

  const parsed = updateHighlightSchema.safeParse(body)
  if (!parsed.success) return jsonError('Campos inválidos', 400)

  const updates = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined))

  if (Object.keys(updates).length === 0) return jsonError('Nenhum campo para atualizar', 400)

  const { data, error } = await supabase
    .from('entry_highlights')
    .update(updates)
    .eq('id', highlightId)
    .eq('entry_id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle()

  if (error) return jsonError('Erro ao atualizar destaque', 500)
  if (!data) return jsonError('Destaque não encontrado', 404)

  if ('tags' in updates) {
    await rollupEntryTags(supabase, id)
  }

  return NextResponse.json({ ok: true, highlight: data })
}

/**
 * `DELETE /api/entries/[id]/highlights/[highlightId]` (US4, FR-015) — remove UM destaque,
 * recalcula o rollup de tags e nunca remove a fonte (`entries`) nem os demais destaques.
 */
export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('Não autorizado', 401)

  const { id, highlightId } = await context.params

  const { error, count } = await supabase
    .from('entry_highlights')
    .delete({ count: 'exact' })
    .eq('id', highlightId)
    .eq('entry_id', id)
    .eq('user_id', user.id)

  if (error) return jsonError('Erro ao remover destaque', 500)
  if (!count) return jsonError('Destaque não encontrado', 404)

  await rollupEntryTags(supabase, id)

  return NextResponse.json({ ok: true })
}
