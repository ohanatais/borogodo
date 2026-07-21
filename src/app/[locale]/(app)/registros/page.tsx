import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { getFeedData } from '@/lib/feed/getFeedData'
import { FeedPage } from '@/components/features/feed/FeedPage'
import type { FeedAxis, FeedQuery } from '@/lib/feed/types'
import type { EntrySource } from '@/types/entry'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata: Metadata = {
  title: 'Registros | Borogodó',
}

interface RegistrosPageProps {
  searchParams: Promise<Record<string, string | string[]>>
}

const VALID_SOURCES: EntrySource[] = ['text', 'chips', 'audio', 'linkedin_pdf', 'image', 'deposito']

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
  const entryId = sp(params, 'entry')
  const source = VALID_SOURCES.includes(rawSource as EntrySource) ? (rawSource as EntrySource) : undefined

  const query: FeedQuery = {
    axis,
    ...(entryId && { entryId }),
    ...(q && { q }),
    ...(from && { from }),
    ...(to && { to }),
    ...(company && { company }),
    ...(rawTags && { tags: rawTags.split(',') }),
    ...(metricOnly && { metricOnly }),
    ...(source && { source }),
  }

  const filterKey = [axis, q, from, to, company, rawTags, String(metricOnly), rawSource, entryId].join('|')
  const initialPage = await getFeedData(supabase, user.id, query)

  return (
    <PageContainer className="pb-28 lg:pb-10">
      <PageHeader title={t('title')} description={t('subtitle')} className="mb-6" />

      <FeedPage filterKey={filterKey} initialPage={initialPage} initialQuery={query} />
    </PageContainer>
  )
}
