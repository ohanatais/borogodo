import { generateAndSaveMirror } from '@/lib/ai/mirror/generateMirror'
import { getSupabaseAdmin } from '@/lib/db/supabaseAdmin'
import { errorMessage } from '@/lib/errors'
import { logger } from '@/lib/log'

const REGEN_EVERY = 3

async function loadLastEntryCount(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string
): Promise<number> {
  const { data, error } = await admin
    .from('mirror_snapshots')
    .select('entry_count')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error('Não foi possível ler o último snapshot')
  }

  return (data as { entry_count?: number } | null)?.entry_count ?? 0
}

/**
 * Regenera o espelho a cada `REGEN_EVERY` novas entradas desde o último snapshot.
 * Roda fora do request (sem cookie de sessão) — usa client `service_role`, sempre
 * filtrando `user_id`. Erros são logados (sem dados de usuário) e o snapshot anterior
 * é preservado; nunca quebra a captura. Um erro de leitura pula a regeneração (não
 * dispara uma geração indevida tratando a falha como "zero entradas").
 */
export async function maybeRegenerateMirror(userId: string, newTotal: number): Promise<void> {
  const admin = getSupabaseAdmin()

  try {
    const lastCount = await loadLastEntryCount(admin, userId)

    if (newTotal - lastCount >= REGEN_EVERY) {
      await generateAndSaveMirror(admin, userId)
    }
  } catch (error: unknown) {
    logger.error('mirror regeneration failed', { message: errorMessage(error) })
  }
}
