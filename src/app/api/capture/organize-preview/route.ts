import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { previewOrganize } from '@/lib/entries/previewOrganize'

const bodySchema = z.object({
  // Sem limite superior — mesma regra do `/api/capture` (contracts/capture.md, "sem rejeição por
  // tamanho de texto"). O corte de tokens pra IA já acontece dentro de `buildOrganizeUserPrompt`
  // (`RAW_TEXT_LIMIT`, trunca em vez de rejeitar) — um `.max()` aqui só duplicava essa regra de um
  // jeito pior: rejeitava a chamada inteira (400) em vez de truncar, quebrando "Organizar" pra
  // qualquer transcrição colada acima de 8000 caracteres (bug real encontrado em teste manual).
  rawText: z.string().min(1),
  company: z.string().nullable().optional(),
  isPersonalProject: z.boolean().optional(),
  entryDate: z.string().nullable().optional(),
})

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * `POST /api/capture/organize-preview` — "Organizar" dentro do Drawer, antes de salvar. Reusa a
 * mesma extração de `organizeEntry` via `previewOrganize`, mas sem entry existente: só devolve o
 * resultado, nunca persiste nada. Falha de IA nunca vira 5xx (mesma garantia de FR-030 aplicada
 * aqui, embora esta rota seja anterior ao salvar).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('Não autorizado', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('Body inválido', 400)
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return jsonError('Campos inválidos', 400)

  const outcome = await previewOrganize(supabase, user.id, {
    rawText: parsed.data.rawText,
    company: parsed.data.company ?? null,
    isPersonalProject: parsed.data.isPersonalProject ?? false,
    entryDate: parsed.data.entryDate ?? null,
  })

  if (outcome.status === 'failed') return NextResponse.json({ status: 'failed' })

  return NextResponse.json({ status: 'organized', ...outcome.result })
}
