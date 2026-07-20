import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { insertPreparation, listPreparations } from '@/lib/db/preparations'
import { createPreparationSchema } from '@/types/preparation'
import { logger } from '@/lib/log'

const error = (code: string, status: number) => NextResponse.json({ error: code }, { status })

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return error('unauthorized', 401)
  return NextResponse.json({ preparations: await listPreparations(supabase, user.id) })
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return error('unauthorized', 401)

  const parsed = createPreparationSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return error('invalid_request', 400)

  try {
    const title = `Preparação para ${parsed.data.moment === 'entrevista' ? 'entrevista' : parsed.data.moment === 'review' ? 'conversa de avaliação' : 'pedido de aumento'}`
    const preparation = await insertPreparation(supabase, user.id, { ...parsed.data, title })
    return NextResponse.json({ preparation }, { status: 201 })
  } catch (cause) {
    logger.error('preparation save failed', { kind: cause instanceof Error ? cause.message : 'unknown' })
    return error('persist_failed', 500)
  }
}
