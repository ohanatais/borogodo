import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { getFeedData } from '@/lib/feed/getFeedData'
import { FeedPage } from '@/components/features/feed/FeedPage'
import type { FeedAxis, FeedQuery } from '@/lib/feed/types'
import type { EntrySource } from '@/types/entry'

export const metadata: Metadata = {
  title: 'Registros | Borogodó',
}

interface RegistrosPageProps {
  searchParams: Promise<Record<string, string | string[]>>
}

const VALID_SOURCES: EntrySource[] = ['text', 'chips', 'audio', 'linkedin_pdf', 'image']

function sp(params: Record<string, string | string[]>, key: string): string {
  const v = params[key]
  return (Array.isArray(v) ? v[0] : v) ?? ''
}

export default async function RegistrosPage({ searchParams }: RegistrosPageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const params = await searchParams
  const t = await getTranslations('feed')

  const axis: FeedAxis = sp(params, 'axis') === 'entry_date' ? 'entry_date' : 'created_at'
  const q = sp(params, 'q')
  const from = sp(params, 'from')
  const to = sp(params, 'to')
  const company = sp(params, 'company')
  const rawTags = sp(params, 'tags')
  const metricOnly = sp(params, 'metricOnly') === 'true'
  const rawSource = sp(params, 'source')
  const source = VALID_SOURCES.includes(rawSource as EntrySource) ? (rawSource as EntrySource) : undefined

  const query: FeedQuery = {
    axis,
    ...(q && { q }),
    ...(from && { from }),
    ...(to && { to }),
    ...(company && { company }),
    ...(rawTags && { tags: rawTags.split(',') }),
    ...(metricOnly && { metricOnly }),
    ...(source && { source }),
  }

  const filterKey = [axis, q, from, to, company, rawTags, String(metricOnly), rawSource].join('|')
  const initialPage = await getFeedData(supabase, user.id, query)

  return (
    <div className="max-w-[980px] mx-auto px-6 py-8">
      <header className="mb-6">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', lineHeight: '1.2', letterSpacing: '-0.015em' }}
        >
          {t('title')}
        </h1>
      </header>

      <FeedPage key={filterKey} initialPage={initialPage} initialQuery={query} />
    </div>
  )
}
