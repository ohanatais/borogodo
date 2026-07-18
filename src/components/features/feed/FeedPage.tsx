'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams, useRouter } from 'next/navigation'
import type { FeedPage as FeedPageType, FeedItem, FeedQuery, FeedAxis, ActivityCell } from '@/lib/feed/types'
import { groupFeedItemsByMonth } from '@/lib/feed/groupByMonth'
import { SourceCard } from './SourceCard'
import { EmptyFeed } from './EmptyFeed'
import { FeedFilters } from './FeedFilters'
import { ENTRY_UPDATED_EVENT, type EntryUpdatedDetail } from '@/components/features/painel/registroTriggerEvents'

interface FeedPageProps {
  filterKey: string
  initialPage: FeedPageType
  initialQuery: FeedQuery
}

function hasActiveFilters(searchParams: URLSearchParams): boolean {
  return !!(
    searchParams.get('q') ||
    searchParams.get('from') ||
    searchParams.get('to') ||
    searchParams.get('company') ||
    searchParams.get('tags') ||
    searchParams.get('source')
  )
}

export function FeedPage({ filterKey, initialPage, initialQuery }: FeedPageProps) {
  const t = useTranslations('feed')
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentAxis = (searchParams.get('axis') as FeedAxis) ?? initialQuery.axis

  const [items, setItems] = useState<FeedItem[]>(initialPage.items)
  const [nextCursor, setNextCursor] = useState<string | null>(initialPage.nextCursor)
  const [isLoading, setIsLoading] = useState(false)
  const [activityCells, setActivityCells] = useState<ActivityCell[]>([])
  const [deleteError, setDeleteError] = useState(false)

  // Resync feed state when filters change — the server returned a fresh page.
  // Adjusting state during render (React's recommended pattern) instead of a
  // remounting `key` keeps the search input focused and avoids the activity
  // grid flickering on every keystroke / filter change.
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setItems(initialPage.items)
    setNextCursor(initialPage.nextCursor)
  }

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/feed/activity', { signal: controller.signal })
      .then((r) => r.ok ? r.json() : [])
      .then((cells: ActivityCell[]) => setActivityCells(cells))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  // Deep-link "Ver registro" (autoavaliação, 019): o feed vem por SSR, então o alvo #registro-<id> já
  // existe no mount. O Next App Router não rola para hash em container de scroll próprio, então o
  // fazemos aqui — rola e realça por 2s. Best-effort: se o registro não está na 1ª página, nada ocorre.
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.startsWith('#registro-')) return
    const el = document.getElementById(hash.slice(1))
    if (!el) return
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    el.style.transition = 'box-shadow 300ms ease-out'
    el.style.boxShadow = '0 0 0 2px var(--color-primary)'
    const timer = setTimeout(() => { el.style.boxShadow = '' }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Contagem real (não mockada) pro texto discreto "N registros em M meses" — sem grade visual
  // de atividade (removida: para o ritmo de uso deste produto, a grade ficava majoritariamente
  // vazia e lia como cobrança, o mesmo risco que FR-029 já evitava tirando o streak gamificado).
  const activityStats = useMemo(() => {
    const activeCells = activityCells.filter((c) => c.count > 0)
    const totalRegistros = activeCells.reduce((sum, c) => sum + c.count, 0)
    const monthKeys = new Set(activeCells.map((c) => c.date.slice(0, 7)))
    return { totalRegistros, monthCount: monthKeys.size }
  }, [activityCells])

  // FR-028: timeline por mês — agrupa pela MESMA data usada para ordenar a página (`currentAxis`),
  // nunca uma escolha fixa (ver `groupByMonth.ts`) — senão a seção do mês poderia divergir da
  // ordem real da lista.
  const monthGroups = useMemo(() => groupFeedItemsByMonth(items, currentAxis), [items, currentAxis])

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
    // Remoção otimista: guarda o item e sua posição para reverter se a chamada falhar.
    let removed: { item: FeedItem; index: number } | null = null
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id)
      if (index === -1) return prev
      removed = { item: prev[index], index }
      return prev.filter((item) => item.id !== id)
    })

    const rollback = () => {
      if (!removed) return
      const { item, index } = removed
      setItems((prev) => {
        const next = [...prev]
        next.splice(Math.min(index, next.length), 0, item)
        return next
      })
      setDeleteError(true)
    }

    try {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' })
      if (!res.ok) rollback()
    } catch {
      rollback()
    }
  }, [])

  // Editar (026): o Drawer que salva a edição vive no shell (AppShellClient), fora desta árvore —
  // `router.refresh()` sozinho não resincroniza o estado local otimista de `items`, então ouvimos
  // o mesmo evento que o Drawer dispara ao confirmar o PATCH.
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<EntryUpdatedDetail>).detail
      setItems((prev) =>
        prev.map((item) =>
          item.id === detail.id
            ? {
                ...item,
                what_i_did: detail.what_i_did,
                title: detail.what_i_did.slice(0, 60).trim(),
                ...(detail.metric !== undefined && detail.metric && { metric: detail.metric }),
                ...(detail.company !== undefined && { company: detail.company || item.company }),
                ...(detail.entryDate !== undefined && detail.entryDate && { entry_date: detail.entryDate }),
              }
            : item
        )
      )
    }
    window.addEventListener(ENTRY_UPDATED_EVENT, handler)
    return () => window.removeEventListener(ENTRY_UPDATED_EVENT, handler)
  }, [])

  // Story 2 (FR-004): atualização local, otimista, após o `PATCH` do `ContextPillPicker` já ter
  // confirmado sucesso — não dispara nenhuma chamada de IA (FR-003, custo zero).
  const handleContextChange = useCallback(
    (id: string, next: { company: string | null; isPersonalProject: boolean }) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, company: next.company, is_personal_project: next.isPersonalProject } : item
        )
      )
    },
    []
  )

  const filtersActive = hasActiveFilters(searchParams)

  if (items.length === 0 && !filtersActive) {
    return <EmptyFeed />
  }

  return (
    <div className="flex flex-col gap-4">
      {deleteError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 text-sm rounded-lg px-4 py-3"
          style={{ background: 'var(--destructive-muted, var(--muted))', color: 'var(--destructive)' }}
        >
          <span>{t('deleteError')}</span>
          <button
            type="button"
            onClick={() => setDeleteError(false)}
            className="font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
          >
            {t('deleteErrorDismiss')}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <FeedFilters currentAxis={currentAxis} />
        {activityStats.totalRegistros > 0 && (
          <p className="text-xs px-1" style={{ color: 'var(--muted-foreground)' }}>
            {t('grid.subtitle', { count: activityStats.totalRegistros, months: activityStats.monthCount })}
          </p>
        )}
      </div>

      {items.length === 0 && filtersActive ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {t('empty.filtered')}
          </p>
          <button
            type="button"
            onClick={() => router.replace('?', { scroll: false })}
            className="text-sm font-medium px-4 py-2.5 rounded-full transition-opacity hover:opacity-80"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            {t('filters.clear')}
          </button>
        </div>
      ) : (
        <>
          {/* Lista de registros, agrupada numa timeline por mês (FR-028) */}
          <div className="flex flex-col gap-4">
            {monthGroups.map((group) => (
              <section key={group.monthKey} className="flex flex-col gap-2">
                <div className="flex items-center gap-3 px-1">
                  <h2
                    className="shrink-0 text-sm font-display font-semibold"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {group.label}
                  </h2>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1"
                    style={{ background: 'color-mix(in oklch, var(--border) 60%, transparent)' }}
                  />
                  <span className="shrink-0 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {t('timeline.count', { count: group.items.length })}
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <SourceCard
                      key={item.id}
                      item={item}
                      variant="feed"
                      onDelete={handleDelete}
                      onContextChange={handleContextChange}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {nextCursor && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="text-sm font-medium px-4 py-2.5 rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
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
