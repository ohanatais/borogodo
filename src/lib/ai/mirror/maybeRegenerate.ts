import { generateAndSaveMirror } from '@/lib/ai/mirror/generateMirror'
import { getSupabaseAdmin } from '@/lib/db/supabaseAdmin'
import { logger } from '@/lib/log'

const REGEN_EVERY = 3

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error'
}

async function loadLastEntryCount(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string
): Promise<number> {
  const { data } = await admin
    .from('mirror_snapshots')
    .select('entry_count')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as { entry_count?: number } | null)?.entry_count ?? 0
}

/**
 * Regenera o espelho a cada `REGEN_EVERY` novas entradas desde o último snapshot.
 * Roda fora do request (sem cookie de sessão) — usa client `service_role`, sempre
 * filtrando `user_id`. Erros são logados (sem dados de usuário) e o snapshot anterior
 * é preservado; nunca quebra a captura.
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
