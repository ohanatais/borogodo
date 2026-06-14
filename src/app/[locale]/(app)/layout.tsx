import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { getCapturePrompt } from '@/lib/panel/getCapturePrompt'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileRes, recentRes, t] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
    supabase
      .from('entries')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    getTranslations('capture.composer.prompt'),
  ])

  const name = (profileRes.data as { name?: string | null } | null)?.name ?? ''
  const lastEntryDate = (recentRes.data as { created_at?: string } | null)?.created_at
  const daysSince = lastEntryDate
    ? Math.floor((Date.now() - new Date(lastEntryDate).getTime()) / 86_400_000)
    : null

  const prompt = getCapturePrompt(daysSince, [])
  const captureHint = t(prompt.key, prompt.values)

  return (
    <AppShell userName={name} captureHint={captureHint}>
      {children}
    </AppShell>
  )
}
