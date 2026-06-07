'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase/server'

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
