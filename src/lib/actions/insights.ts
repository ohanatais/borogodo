'use server'

import { createServerClient } from '@/lib/db/supabase/server'
import { logger } from '@/lib/log'
import { errorMessage } from '@/lib/errors'

/**
 * Marca um insight proativo como visto. Roda no contexto do usuário (RLS garante
 * que só seus próprios insights podem ser atualizados). Falhas são logadas e
 * silenciadas — não devem quebrar a experiência do painel.
 */
export async function markInsightSeen(insightId: string): Promise<void> {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.from('proactive_insights').update({ seen: true }).eq('id', insightId)

    if (error) {
      throw new Error(error.message)
    }
  } catch (error: unknown) {
    logger.error('failed to mark insight as seen', { message: errorMessage(error) })
  }
}
