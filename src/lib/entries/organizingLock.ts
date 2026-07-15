import { ORGANIZING_TIMEOUT_MS } from '@/lib/entries/organizationStatus'
import type { createServerClient } from '@/lib/db/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

export type OrganizingLockResult = 'acquired' | 'already_organizing' | 'not_found'

/**
 * Adquire o lock de organização de forma atômica (FR-031) — um único `UPDATE ... WHERE
 * organizing_started_at IS NULL OR organizing_started_at < cutoff` no banco, em vez do padrão
 * anterior de "ler o valor, depois decidir, depois escrever" (dois round-trips separados).
 *
 * Esse padrão de dois passos era vulnerável a corrida real entre os dois pontos que disparam
 * organização (US1, clique manual em `POST /organize`, e US3, `triggerOrganizeEntry` assíncrono
 * no salvar): salvar um registro dispara o job assíncrono; se a pessoa clicar em "Organizar"
 * manualmente nos primeiros instantes, as duas chamadas podiam ler `organizing_started_at` como
 * `null` ANTES de qualquer uma escrever o lock, passando as duas pela guarda e chamando a IA em
 * paralelo — duas chamadas Haiku para a mesma fonte (custo em dobro) e destaques duplicados
 * (`insertNewHighlights` calcula `startPosition` a partir da mesma leitura desatualizada nas
 * duas chamadas).
 *
 * A condição do `WHERE` só é reavaliada depois que a linha é bloqueada (Postgres, isolamento
 * padrão READ COMMITTED) — a segunda chamada concorrente espera a primeira commitar, então
 * reavalia a condição contra o valor já commitado (recém-escrito, portanto "recente") e não
 * casa mais nenhuma linha. Só uma das duas chamadas concorrentes recebe `'acquired'`.
 */
export async function tryAcquireOrganizingLock(
  supabase: SupabaseServerClient,
  entryId: string,
  userId: string
): Promise<OrganizingLockResult> {
  const cutoffIso = new Date(Date.now() - ORGANIZING_TIMEOUT_MS).toISOString()

  const { data, error } = await supabase
    .from('entries')
    .update({ organizing_started_at: new Date().toISOString() })
    .eq('id', entryId)
    .eq('user_id', userId)
    .or(`organizing_started_at.is.null,organizing_started_at.lt.${cutoffIso}`)
    .select('id')

  if (error) throw error
  if (data && data.length > 0) return 'acquired'

  // Nenhuma linha casou o UPDATE — ou a fonte não existe/não é do usuário, ou já está sendo
  // organizada agora (lock recente segurado por outra chamada). Distingue os dois com uma
  // leitura simples (sem afetar a atomicidade do lock em si, que já foi decidida acima).
  const { data: existing } = await supabase.from('entries').select('id').eq('id', entryId).eq('user_id', userId).maybeSingle()

  return existing ? 'already_organizing' : 'not_found'
}
