import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { getFeedData } from '@/lib/feed/getFeedData'
import { FeedPage } from '@/components/features/feed/FeedPage'
import type { FeedAxis, FeedQuery } from '@/lib/feed/types'

export const metadata: Metadata = {
  title: 'Registros | Borogodó',
}

interface RegistrosPageProps {
  searchParams: Promise<Record<string, string | string[]>>
}

export default async function RegistrosPage({ searchParams }: RegistrosPageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const params = await searchParams
  const rawAxis = Array.isArray(params.axis) ? params.axis[0] : params.axis
  const axis: FeedAxis = rawAxis === 'entry_date' ? 'entry_date' : 'created_at'
  const t = await getTranslations('feed')

  const query: FeedQuery = { axis }
  const initialPage = await getFeedData(supabase, user.id, query)

  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-9 py-8">
      <header className="mb-6">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {t('title')}
        </h1>
      </header>

      <FeedPage initialPage={initialPage} initialQuery={query} />
    </div>
  )
}
