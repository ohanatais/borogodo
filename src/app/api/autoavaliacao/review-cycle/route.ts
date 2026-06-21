import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { errorMessage } from '@/lib/errors'
import { logger } from '@/lib/log'

/** Default conceitual trimestral (data-model D8); a pessoa pode mudar depois nas configurações. */
const DEFAULT_REVIEW_CYCLE_MONTHS = 3

const reviewCycleSchema = z.object({
  anchor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // a data que a pessoa define ao aceitar o plano
  months: z.number().int().min(1).max(24).optional(),
})

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

/**
 * POST /api/autoavaliacao/review-cycle (019, US2) — grava a recorrência do ciclo de avaliação em
 * `profiles` (gatilho ético: só dispara o convite de painel quando A PESSOA definiu a data). Auth-first;
 * `user_id` da sessão (nunca do payload); RLS reforça. Sem recorrência definida → o painel não convida.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('unauthorized', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('invalid_request', 400)
  }

  const parsed = reviewCycleSchema.safeParse(body)
  if (!parsed.success) return jsonError('invalid_request', 400)

  // Revisão é compromisso futuro: hoje ou no passado não é aceito (e marcar hoje nem dispararia o ciclo).
  const today = new Date().toISOString().slice(0, 10)
  if (parsed.data.anchor <= today) return jsonError('invalid_request', 400)

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        review_cycle_anchor: parsed.data.anchor,
        review_cycle_months: parsed.data.months ?? DEFAULT_REVIEW_CYCLE_MONTHS,
      })
      .eq('id', user.id)

    if (error) return jsonError('internal_error', 500)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: unknown) {
    logger.error('review cycle save failed', { message: errorMessage(error) })
    return jsonError('internal_error', 500)
  }
}
