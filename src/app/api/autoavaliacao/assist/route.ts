import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { assist, AssistFailedError } from '@/lib/ai/content/assist'
import { errorMessage } from '@/lib/errors'
import { aiLimitResponse } from '@/lib/ai/cost/limitResponse'
import { logger } from '@/lib/log'

const MAX_TEXT_CHARS = 5000

const assistRequestSchema = z
  .object({
    mode: z.enum(['rephrase', 'unblock', 'star_nudge']),
    section: z.enum(['entregas', 'impacto', 'evolucao', 'pontos_a_desenvolver']),
    text: z.string().min(1).max(MAX_TEXT_CHARS).optional(),
    seedRef: z.string().max(500).optional(),
  })
  // rephrase e star_nudge operam sobre o texto da pessoa: sem `text`, não há o que reformular/avaliar.
  .refine((d) => !((d.mode === 'rephrase' || d.mode === 'star_nudge') && !d.text), {
    message: 'text is required for this mode',
  })

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

/**
 * POST /api/autoavaliacao/assist — assistência não-invasiva à escrita (US1). Auth-first; input validado
 * por Zod antes de qualquer LLM; o contexto de IA é só o texto da própria pessoa (sem dado de outro
 * usuário). NUNCA gera o bloco nem dá nota. Falha do assist degrada em 422 (a escrita segue).
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

  const parsed = assistRequestSchema.safeParse(body)
  if (!parsed.success) return jsonError('invalid_request', 400)

  try {
    const result = await assist({ ...parsed.data, userId: user.id })
    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    const limited = aiLimitResponse(error)
    if (limited) return limited

    if (error instanceof AssistFailedError) {
      return jsonError('assist_failed', 422)
    }

    logger.error('autoavaliacao assist failed', { message: errorMessage(error) })
    return jsonError('internal_error', 500)
  }
}
