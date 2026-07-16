'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef } from 'react'
import { Search, X, CalendarRange } from 'lucide-react'
import { Segmented } from '@/components/ui/Segmented'
import type { FeedAxis } from '@/lib/feed/types'

interface FeedFiltersProps {
  currentAxis: FeedAxis
}

export function FeedFilters({ currentAxis }: FeedFiltersProps) {
  const t = useTranslations('feed')
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentQ = searchParams.get('q') ?? ''
  const currentFrom = searchParams.get('from') ?? ''
  const currentTo = searchParams.get('to') ?? ''

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

  const hasActiveFilters = currentQ || currentFrom || currentTo

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
    <div className="flex items-center gap-2 flex-wrap">
      {/* Busca — ação primária, lidera a fileira */}
      <div className="relative w-full max-w-[220px]">
        <Search
          size={14}
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
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-full outline-none focus-visible:ring-2"
          style={{
            background: 'var(--muted)',
            color: 'var(--foreground)',
            border: '1px solid transparent',
          }}
        />
      </div>

      {/* Período — um único controle (não duas caixas separadas De/Até) */}
      <div
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--card)' }}
      >
        <CalendarRange size={13} aria-hidden="true" className="shrink-0" />
        <input
          type="date"
          value={currentFrom}
          max={currentTo || undefined}
          aria-label={t('filters.dateFrom')}
          onChange={(e) => updateParam('from', e.target.value || null)}
          className="bg-transparent outline-none w-[110px]"
          style={{ color: currentFrom ? 'var(--foreground)' : 'var(--muted-foreground)' }}
        />
        <span aria-hidden="true">–</span>
        <input
          type="date"
          value={currentTo}
          min={currentFrom || undefined}
          aria-label={t('filters.dateTo')}
          onChange={(e) => updateParam('to', e.target.value || null)}
          className="bg-transparent outline-none w-[110px]"
          style={{ color: currentTo ? 'var(--foreground)' : 'var(--muted-foreground)' }}
        />
      </div>

      <Segmented
        ariaLabel="Eixo de ordenação"
        items={axes.map((axis) => ({
          key: axis,
          label: t(`axis.${axis}`),
          active: currentAxis === axis,
          onClick: () => handleAxisChange(axis),
        }))}
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearAll}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-opacity hover:opacity-70 ml-auto"
          style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
        >
          <X size={12} aria-hidden="true" />
          {t('filters.clear')}
        </button>
      )}
    </div>
  )
}
