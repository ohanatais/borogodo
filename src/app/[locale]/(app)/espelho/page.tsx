import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase/server'
import { getLatestSnapshot } from '@/lib/db/mirror'
import { MirrorContent } from '@/components/features/espelho/MirrorContent'

export default async function EspelhoPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [snapshot, profileRes] = await Promise.all([
    getLatestSnapshot(supabase, user.id),
    supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
  ])

  if (!snapshot) redirect('/painel')

  const profileName = (profileRes.data as { name?: string | null } | null)?.name ?? ''

  return (
    <div>
      <MirrorContent snapshot={snapshot} userName={profileName} />
    </div>
  )
}
