import { getSupabaseAdmin } from '@/lib/db/supabaseAdmin'
import type { ProactiveInsight, ProactiveInsightType } from '@/types/insight'

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>

export async function countUnseenInsights(admin: SupabaseAdmin, userId: string): Promise<number> {
  const { count, error } = await admin
    .from('proactive_insights')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('seen', false)

  if (error) {
    throw new Error('Não foi possível contar os insights não vistos')
  }

  return count ?? 0
}

interface InsertProactiveInsightInput {
  userId: string
  type: ProactiveInsightType
  headline: string
  body: string
  entryIds: string[]
}

export async function insertProactiveInsight(
  admin: SupabaseAdmin,
  { userId, type, headline, body, entryIds }: InsertProactiveInsightInput
): Promise<ProactiveInsight> {
  const { data, error } = await admin
    .from('proactive_insights')
    .insert({
      user_id: userId,
      type,
      headline,
      body,
      entry_ids: entryIds,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error('Não foi possível salvar o insight proativo')
  }

  return data as ProactiveInsight
}
