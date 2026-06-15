import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/db/supabase/server'
import { getHistoricoData } from '@/lib/historico/getHistoricoData'
import { HistoricoPageClient } from './HistoricoPageClient'

export const metadata: Metadata = {
  title: 'Linha do Tempo | Borogodó',
}

export default async function HistoricoPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const data = await getHistoricoData(supabase, user.id)

  return (
    <div className="py-6">
      <HistoricoPageClient data={data} />
    </div>
  )
}
