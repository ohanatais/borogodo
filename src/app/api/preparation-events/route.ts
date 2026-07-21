import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { preparationEventSchema } from '@/types/preparation'

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const parsed = preparationEventSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  const { error } = await supabase.from('preparation_events').insert({
    user_id: user.id, event_name: parsed.data.eventName, moment: parsed.data.moment ?? null, properties: parsed.data.properties,
  })
  if (error) return NextResponse.json({ error: 'persist_failed' }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
