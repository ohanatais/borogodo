'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { FeedAxis } from '@/lib/feed/types'

interface FeedFiltersProps {
  currentAxis: FeedAxis
}

export function FeedFilters({ currentAxis }: FeedFiltersProps) {
  const t = useTranslations('feed')
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleAxisChange(newAxis: FeedAxis) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('axis', newAxis)
    params.delete('cursor')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const axes: FeedAxis[] = ['created_at', 'entry_date']

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center p-0.5 rounded-full"
        style={{ background: 'var(--muted)' }}
        role="group"
        aria-label="Eixo de ordenação"
      >
        {axes.map((axis) => {
          const active = currentAxis === axis
          return (
            <button
              key={axis}
              type="button"
              onClick={() => handleAxisChange(axis)}
              aria-pressed={active}
              className="text-xs px-3 py-1.5 rounded-full transition-all min-h-[36px]"
              style={{
                background: active ? 'var(--card)' : 'transparent',
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: active ? 600 : 400,
                boxShadow: active ? '0 1px 3px oklch(0% 0 0 / 0.1)' : 'none',
              }}
            >
              {t(`axis.${axis}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
