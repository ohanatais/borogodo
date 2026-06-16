'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import type { FeedPage as FeedPageType, FeedItem, FeedQuery } from '@/lib/feed/types'
import { EntryCard } from './EntryCard'
import { EmptyFeed } from './EmptyFeed'

interface FeedPageProps {
  initialPage: FeedPageType
  initialQuery: FeedQuery
}

export function FeedPage({ initialPage, initialQuery }: FeedPageProps) {
  const t = useTranslations('feed')
  const [items, setItems] = useState<FeedItem[]>(initialPage.items)
  const [nextCursor, setNextCursor] = useState<string | null>(initialPage.nextCursor)
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isLoading) return
    setIsLoading(true)

    try {
      const params = new URLSearchParams()
      params.set('axis', initialQuery.axis)
      params.set('cursor', nextCursor)
      if (initialQuery.q) params.set('q', initialQuery.q)

      const res = await fetch(`/api/feed?${params.toString()}`)
      if (!res.ok) return

      const page = (await res.json()) as FeedPageType
      setItems((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
    } finally {
      setIsLoading(false)
    }
  }, [nextCursor, isLoading, initialQuery])

  const handleDelete = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))

    try {
      await fetch(`/api/entries?ids=${id}`, { method: 'DELETE' })
    } catch {
      // Silently ignore — the item is already removed from UI.
      // On next page load the server state will be correct.
    }
  }, [])

  if (items.length === 0) {
    return <EmptyFeed />
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <EntryCard
            key={item.id}
            item={item}
            variant="feed"
            onDelete={handleDelete}
          />
        ))}
      </ul>

      {nextCursor && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="text-sm font-medium px-5 py-2.5 min-h-[48px] rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            {isLoading ? '…' : t('pagination.loadMore')}
          </button>
        </div>
      )}
    </div>
  )
}
