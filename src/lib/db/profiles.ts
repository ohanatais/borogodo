import type { createServerClient } from '@/lib/db/supabase/server'
import type { Profile } from '@/types/profile'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

export async function getProfile(
  supabase: SupabaseServerClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  return data as Profile | null
}
