import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonError('Não autorizado', 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('Body inválido', 400)
  }

  const ids = (body as Record<string, unknown>)?.ids

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    !ids.every((id) => typeof id === 'string')
  ) {
    return jsonError('ids deve ser um array não-vazio de strings', 400)
  }

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('user_id', user.id)
    .in('id', ids)

  if (error) {
    return jsonError('Erro ao remover entradas', 500)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
