import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { ENRICHABLE_FIELDS, enrichEntryField, type EnrichableField } from '@/lib/db/entries'

const ERROR_MESSAGES = {
  unauthorized: 'Não autorizado',
  invalidField: 'Campo inválido para enriquecimento',
  emptyAnswer: 'A resposta não pode estar vazia',
  notFound: 'Entrada não encontrada',
}

interface RouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

function isEnrichableField(field: unknown): field is EnrichableField {
  return typeof field === 'string' && (ENRICHABLE_FIELDS as readonly string[]).includes(field)
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonError(ERROR_MESSAGES.unauthorized, 401)
  }

  const { id } = await context.params
  const body = (await request.json()) as { field?: unknown; answer?: unknown }

  if (!isEnrichableField(body.field)) {
    return jsonError(ERROR_MESSAGES.invalidField, 400)
  }

  if (typeof body.answer !== 'string' || body.answer.trim().length === 0) {
    return jsonError(ERROR_MESSAGES.emptyAnswer, 400)
  }

  const entry = await enrichEntryField(supabase, id, body.field, body.answer.trim())

  if (!entry) {
    return jsonError(ERROR_MESSAGES.notFound, 404)
  }

  return NextResponse.json({ ok: true, entry }, { status: 200 })
}
