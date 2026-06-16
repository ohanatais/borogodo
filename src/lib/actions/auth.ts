'use server'

import { createServerClient } from '@/lib/db/supabase/server'

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  // Navegação feita client-side para garantir que o browser processa
  // os Set-Cookie (limpeza dos cookies de auth) antes de redirecionar.
}
