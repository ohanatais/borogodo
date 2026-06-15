import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { z } from 'zod'

const updateEntrySchema = z.object({
  what_i_did: z.string().min(1).max(2000).optional(),
  company: z.string().max(200).nullable().optional(),
  role_title: z.string().max(200).nullable().optional(),
  entry_date: z.string().nullable().optional(),
  impact: z.string().max(1000).nullable().optional(),
  metric: z.string().max(200).nullable().optional(),
  decision: z.string().max(1000).nullable().optional(),
  learning: z.string().max(1000).nullable().optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('Não autorizado', 401)

  const { id } = await context.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('Body inválido', 400)
  }

  const parsed = updateEntrySchema.safeParse(body)
  if (!parsed.success) return jsonError('Campos inválidos', 400)

  const updates = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined)
  )

  if (Object.keys(updates).length === 0) return jsonError('Nenhum campo para atualizar', 400)

  const { data, error } = await supabase
    .from('entries')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle()

  if (error) return jsonError('Erro ao atualizar entrada', 500)
  if (!data) return jsonError('Entrada não encontrada', 404)

  return NextResponse.json({ ok: true, entry: data })
}

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('Não autorizado', 401)

  const { id } = await context.params

  const { error, count } = await supabase
    .from('entries')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return jsonError('Erro ao remover entrada', 500)
  if (count === 0) return jsonError('Entrada não encontrada', 404)

  return NextResponse.json({ ok: true })
}
