import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { buildVoiceProfile } from '@/lib/ai/content/buildVoiceProfile'
import { getVoiceProfile, upsertVoiceProfile } from '@/lib/db/drafts'
import { errorMessage } from '@/lib/errors'
import { logger } from '@/lib/log'

const MAX_SAMPLE_CHARS = 5000
const MAX_RAW_CONTENTS = 20

const voiceRequestSchema = z.object({
  samples: z.array(z.string().max(MAX_SAMPLE_CHARS)).max(2).optional().default([]),
  tone: z.string().max(200).nullish(),
  lengthPref: z.enum(['curto', 'medio', 'longo']).nullish(),
})

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

/** Carrega o `raw_content` das capturas do usuário (fonte da inferência de voz). */
async function loadRawContents(supabase: SupabaseServerClient, userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('entries')
    .select('raw_content')
    .eq('user_id', userId)
    .not('raw_content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(MAX_RAW_CONTENTS)

  return (data ?? [])
    .map((r) => (r as { raw_content: string | null }).raw_content ?? '')
    .filter((c) => c.trim().length > 0)
}

/**
 * PUT /api/content/voice — atualiza o voice_profile (samples/tone/lengthPref), dispara a
 * re-inferência do inferred_summary a partir do raw_content do próprio usuário e devolve o perfil.
 * Auth-first; samples validadas (≤ 2) e sanitizadas antes de qualquer chamada ao LLM (FR-019).
 */
export async function PUT(request: Request): Promise<NextResponse> {
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

  const parsed = voiceRequestSchema.safeParse(body)
  if (!parsed.success) return jsonError('invalid_request', 400)

  const { samples, tone, lengthPref } = parsed.data

  try {
    const [existing, rawContents] = await Promise.all([
      getVoiceProfile(supabase, user.id),
      loadRawContents(supabase, user.id),
    ])

    const profile = await buildVoiceProfile({ rawContents, existing, samples, tone, lengthPref })
    const saved = await upsertVoiceProfile(supabase, user.id, profile)

    return NextResponse.json({ voiceProfile: saved }, { status: 200 })
  } catch (error: unknown) {
    logger.error('voice profile update failed', { message: errorMessage(error) })
    return jsonError('internal_error', 500)
  }
}
