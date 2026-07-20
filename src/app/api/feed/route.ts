import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import { getFeedData } from '@/lib/feed/getFeedData'
import { logger } from '@/lib/log'
import { errorMessage } from '@/lib/errors'
import type { FeedQuery } from '@/lib/feed/types'

const feedQuerySchema = z.object({
  axis: z.enum(['created_at', 'entry_date']).default('created_at'),
  q: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  company: z.string().optional(),
  tags: z.string().optional(),
  metricOnly: z.enum(['true', 'false']).optional(),
  source: z.enum(['linkedin_pdf', 'audio', 'text', 'chips', 'image', 'deposito']).optional(),
  cursor: z.string().optional(),
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
  const parsed = feedQuerySchema.safeParse(rawParams)

  if (!parsed.success) return jsonError('invalid_params', 400)

  const { axis, q, from, to, company, tags: tagsStr, metricOnly, source, cursor } = parsed.data

  const query: FeedQuery = {
    axis,
    q,
    from,
    to,
    company,
    tags: tagsStr ? tagsStr.split(',').filter(Boolean) : undefined,
    metricOnly: metricOnly === 'true',
    source,
    cursor,
  }

  try {
    const page = await getFeedData(supabase, user.id, query)
    return NextResponse.json(page, { status: 200 })
  } catch (error: unknown) {
    logger.error('feed fetch failed', { message: errorMessage(error) })
    return jsonError('internal_error', 500)
  }
}
