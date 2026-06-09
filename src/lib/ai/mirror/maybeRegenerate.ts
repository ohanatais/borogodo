import { generateAndSaveMirror } from '@/lib/ai/mirror/generateMirror'
import { getSupabaseAdmin } from '@/lib/db/supabaseAdmin'
import { errorMessage } from '@/lib/errors'
import { logger } from '@/lib/log'

const REGEN_EVERY = 3

type Admin = ReturnType<typeof getSupabaseAdmin>

async function loadLastSnapshotEntryCount(admin: Admin, userId: string): Promise<number> {
  const { data, error } = await admin
    .from('mirror_snapshots')
    .select('entry_count')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error('Não foi possível ler o último snapshot')

  return (data as { entry_count?: number } | null)?.entry_count ?? 0
}

async function loadTotalEntryCount(admin: Admin, userId: string): Promise<number> {
  const { count, error } = await admin
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw new Error('Não foi possível contar as entradas')

  return count ?? 0
}

/**
 * Regenera o espelho a cada REGEN_EVERY novas entradas desde o último snapshot.
 * Busca o total real de entradas do usuário — não usa o count da request, que só
 * reflete as entradas desta captura e não o histórico acumulado.
 */
export async function maybeRegenerateMirror(userId: string): Promise<void> {
  const admin = getSupabaseAdmin()

  try {
    const [lastCount, newTotal] = await Promise.all([
      loadLastSnapshotEntryCount(admin, userId),
      loadTotalEntryCount(admin, userId),
    ])

    if (newTotal - lastCount >= REGEN_EVERY) {
      await generateAndSaveMirror(admin, userId)
    }
  } catch (error: unknown) {
    logger.error('mirror regeneration failed', { message: errorMessage(error) })
  }
}
