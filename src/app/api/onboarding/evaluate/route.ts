import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { evaluateSufficiency } from '@/lib/ai/mirror/evaluateSufficiency'
import type { SufficiencyEntry } from '@/lib/ai/mirror/evaluateSufficiency'

export async function POST(): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('entries')
    .select('what_i_did, impact, tags')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: 'Erro ao carregar entradas' }, { status: 500 })
  }

  const entries = (data ?? []) as SufficiencyEntry[]
  const result = await evaluateSufficiency(entries, user.id)

  return NextResponse.json(result)
}
