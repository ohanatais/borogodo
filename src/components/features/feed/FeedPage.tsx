'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams, useRouter } from 'next/navigation'
import type { FeedPage as FeedPageType, FeedItem, FeedQuery, FeedAxis, ActivityCell } from '@/lib/feed/types'
import { EntryCard } from './EntryCard'
import { EmptyFeed } from './EmptyFeed'
import { FeedFilters } from './FeedFilters'
import { ActivityGrid, GRID_MIN_DISTINCT_DAYS } from './ActivityGrid'

interface FeedPageProps {
  initialPage: FeedPageType
  initialQuery: FeedQuery
}

function hasActiveFilters(searchParams: URLSearchParams): boolean {
  return !!(
    searchParams.get('q') ||
    searchParams.get('metricOnly') === 'true' ||
    searchParams.get('from') ||
    searchParams.get('to') ||
    searchParams.get('company') ||
    searchParams.get('tags') ||
    searchParams.get('source')
  )
}

export function FeedPage({ initialPage, initialQuery }: FeedPageProps) {
  const t = useTranslations('feed')
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentAxis = (searchParams.get('axis') as FeedAxis) ?? initialQuery.axis

  const [items, setItems] = useState<FeedItem[]>(initialPage.items)
  const [nextCursor, setNextCursor] = useState<string | null>(initialPage.nextCursor)
  const [isLoading, setIsLoading] = useState(false)
  const [activityCells, setActivityCells] = useState<ActivityCell[]>([])

  useEffect(() => {
    fetch('/api/feed/activity')
      .then((r) => r.ok ? r.json() : [])
      .then((cells: ActivityCell[]) => setActivityCells(cells))
      .catch(() => {})
  }, [])

  const distinctDays90 = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    return activityCells.filter((c) => c.date >= cutoffStr && c.count > 0).length
  }, [activityCells])

  const showGrid = distinctDays90 >= GRID_MIN_DISTINCT_DAYS

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isLoading) return
    setIsLoading(true)

    try {
      const params = new URLSearchParams(searchParams.toString())
      params.set('cursor', nextCursor)

      const res = await fetch(`/api/feed?${params.toString()}`)
      if (!res.ok) return

      const page = (await res.json()) as FeedPageType
      setItems((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
    } finally {
      setIsLoading(false)
    }
  }, [nextCursor, isLoading, searchParams])

  const handleDelete = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))

    try {
      await fetch(`/api/entries/${id}`, { method: 'DELETE' })
    } catch {
      // Silently ignore — the item is already removed from UI.
    }
  }, [])

  const handleEdit = useCallback((id: string, what_i_did: string) => {
    setItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, what_i_did, title: what_i_did.slice(0, 60).trim() } : item)
    )
  }, [])

  const filtersActive = hasActiveFilters(searchParams)

  function handleCellClick(date: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('from', date)
    params.set('to', date)
    params.delete('cursor')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  if (items.length === 0 && !filtersActive) {
    return <EmptyFeed />
  }

  return (
    <div className="flex flex-col gap-4">
      <FeedFilters currentAxis={currentAxis} />

      {items.length === 0 && filtersActive ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {t('empty.filtered')}
          </p>
          <button
            type="button"
            onClick={() => router.replace('?', { scroll: false })}
            className="text-sm font-medium px-4 py-2 min-h-[44px] rounded-full transition-opacity hover:opacity-80"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            {t('filters.clear')}
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: faixa horizontal de faíscas acima da lista */}
          {showGrid && (
            <div className="lg:hidden">
              <ActivityGrid cells={activityCells} onCellClick={handleCellClick} />
            </div>
          )}

          <div className="lg:flex lg:gap-6 lg:items-start">
            {/* Lista de registros */}
            <ul className="flex-1 min-w-0 flex flex-col gap-2">
              {items.map((item) => (
                <EntryCard
                  key={item.id}
                  item={item}
                  variant="feed"
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </ul>

            {/* Desktop: grade de faíscas como sidebar fixa à direita */}
            {showGrid && (
              <div className="hidden lg:block shrink-0 sticky top-4">
                <ActivityGrid cells={activityCells} onCellClick={handleCellClick} />
              </div>
            )}
          </div>

          {nextCursor && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="text-sm font-medium px-5 py-2.5 min-h-[48px] rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
              >
                {isLoading ? t('pagination.loading') : t('pagination.loadMore')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
