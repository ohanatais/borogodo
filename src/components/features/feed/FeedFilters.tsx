'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { FeedAxis } from '@/lib/feed/types'

interface FeedFiltersProps {
  currentAxis: FeedAxis
}

const PERIOD_PRESETS = [
  { key: 'today', days: 1 },
  { key: 'week', days: 7 },
  { key: 'month', days: 30 },
  { key: 'quarter', days: 90 },
] as const

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

export function FeedFilters({ currentAxis }: FeedFiltersProps) {
  const t = useTranslations('feed')
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentQ = searchParams.get('q') ?? ''
  const currentMetricOnly = searchParams.get('metricOnly') === 'true'
  const currentFrom = searchParams.get('from') ?? ''

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('cursor')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  function handleAxisChange(newAxis: FeedAxis) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('axis', newAxis)
    params.delete('cursor')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  function handleClearAll() {
    router.replace('?', { scroll: false })
  }

  const hasActiveFilters = currentQ || currentMetricOnly || currentFrom || searchParams.get('to')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value || null
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => updateParam('q', value), 300)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams]
  )

  const axes: FeedAxis[] = ['created_at', 'entry_date']

  return (
    <div className="flex flex-col gap-3">
      {/* Axis toggle */}
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
                className="text-xs px-3 py-1.5 rounded-full transition-all min-h-[44px] hover:opacity-80"
                style={{
                  background: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {t(`axis.${axis}`)}
              </button>
            )
          })}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full transition-opacity hover:opacity-70 min-h-[44px]"
            style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
          >
            <X size={12} aria-hidden="true" />
            {t('filters.clear')}
          </button>
        )}
      </div>

      {/* Search input */}
      <div className="relative">
        <Search
          size={15}
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--muted-foreground)' }}
        />
        <input
          type="search"
          defaultValue={currentQ}
          onChange={handleSearchChange}
          placeholder={t('filters.search')}
          aria-label={t('filters.search')}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl min-h-[44px] outline-none focus-visible:ring-2"
          style={{
            background: 'var(--muted)',
            color: 'var(--foreground)',
            border: '1px solid transparent',
          }}
        />
      </div>

      {/* Filter chips row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Period presets */}
        {PERIOD_PRESETS.map(({ key, days }) => {
          const fromVal = daysAgoISO(days)
          const active = currentFrom === fromVal
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => updateParam('from', active ? null : fromVal)}
              className="inline-flex items-center justify-center text-xs font-medium px-3 min-h-[48px] md:min-h-[36px] rounded-full border transition-colors"
              style={{
                background: active ? 'var(--color-primary)' : 'var(--card)',
                borderColor: active ? 'var(--color-primary)' : 'var(--border)',
                color: active ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
              }}
            >
              {t(`filters.${key}`)}
            </button>
          )
        })}

        {/* Com métrica */}
        <button
          type="button"
          aria-pressed={currentMetricOnly}
          onClick={() => updateParam('metricOnly', currentMetricOnly ? null : 'true')}
          className="inline-flex items-center justify-center text-xs font-medium px-3 min-h-[48px] md:min-h-[36px] rounded-full border transition-colors"
          style={{
            background: currentMetricOnly ? 'var(--color-primary)' : 'var(--card)',
            borderColor: currentMetricOnly ? 'var(--color-primary)' : 'var(--border)',
            color: currentMetricOnly ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
          }}
        >
          {t('filters.metricOnly')}
        </button>
      </div>
    </div>
  )
}
