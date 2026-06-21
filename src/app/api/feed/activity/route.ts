import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { getActivityData } from '@/lib/feed/getActivityData'
import { logger } from '@/lib/log'
import { errorMessage } from '@/lib/errors'

const activityQuerySchema = z.object({
  window: z.coerce.number().int().min(1).max(730).default(365),
})

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return jsonError('unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const rawParams = Object.fromEntries(searchParams.entries())
  const parsed = activityQuerySchema.safeParse(rawParams)

  if (!parsed.success) return jsonError('invalid_params', 400)

  try {
    const cells = await getActivityData(supabase, user.id, parsed.data.window)
    return NextResponse.json(cells, { status: 200 })
  } catch (error: unknown) {
    logger.error('activity fetch failed', { message: errorMessage(error) })
    return jsonError('internal_error', 500)
  }
}
