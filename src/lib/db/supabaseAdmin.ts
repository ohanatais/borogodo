import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedAdmin: SupabaseClient | null = null

/**
 * Client `service_role` para jobs fora do ciclo de request (sem cookie de sessão, RLS não se aplica).
 * Uso restrito a `src/lib/ai/mirror` e `src/lib/ai/insights` — toda query MUST filtrar `user_id` explicitamente.
 * NUNCA importar no client/browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) {
    return cachedAdmin
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Configuração do Supabase admin ausente')
  }

  cachedAdmin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return cachedAdmin
}
