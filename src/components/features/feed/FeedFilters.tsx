'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef } from 'react'
import { Search, X, CalendarRange, FileUp } from 'lucide-react'
import type { FeedAxis } from '@/lib/feed/types'
import { RegistrarButton } from './RegistrarButton'

// Altura comum a busca/período/Registrar/Importar histórico (revisão manual: a fileira de cima
// misturava um botão de 54px com pílulas de filtro bem mais baixas — "não harmônico").
const FILTER_ROW_HEIGHT = 'h-[44px]'

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

  function handleAxisToggle() {
    const params = new URLSearchParams(searchParams.toString())
    const nextAxis: FeedAxis = currentAxis === 'entry_date' ? 'created_at' : 'entry_date'
    params.set('axis', nextAxis)
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

  const isChronological = currentAxis === 'entry_date'

  return (
    <div className="flex flex-col gap-2">
      {/* Busca + período à esquerda, Registrar/Importar histórico à direita — mesma altura nos
          quatro (revisão manual pós-implementação, 026). */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
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
            className={`w-full pl-8 pr-3 text-sm rounded-full outline-none focus-visible:ring-2 ${FILTER_ROW_HEIGHT}`}
            style={{
              background: 'var(--muted)',
              color: 'var(--foreground)',
              border: '1px solid transparent',
            }}
          />
        </div>

        {/* Período — um único controle (não duas caixas separadas De/Até). Mesmo tratamento
            visual da busca (fundo --muted sólido, sem borda). */}
        <div
          className={`inline-flex items-center gap-1.5 text-xs px-4 rounded-full shrink-0 ${FILTER_ROW_HEIGHT}`}
          style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
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

        <div className="flex items-center gap-2 ml-auto">
          <RegistrarButton height={FILTER_ROW_HEIGHT} />
          <button
            type="button"
            disabled
            title={t('composer.comingSoon')}
            className={`inline-flex items-center gap-2 shrink-0 rounded-full px-4 text-sm font-semibold cursor-not-allowed opacity-60 ${FILTER_ROW_HEIGHT}`}
            style={{ color: 'var(--color-primary)', background: 'var(--color-lilas-nevoa)', border: '1px solid var(--color-lilas-linha)' }}
          >
            <FileUp size={16} aria-hidden="true" />
            {t('composer.importHistory')}
          </button>
        </div>
      </div>

      {/* Ordem cronológica (quando aconteceu) vs. ordem de registro (quando anotei, padrão) —
          registros sem data de acontecimento simplesmente vão para o fim da lista quando
          cronológica está ativa (getFeedData já resolve isso, `nullsFirst: false`). Numa fileira
          própria abaixo da busca (revisão manual) — junto de "Limpar filtros" quando ativo. */}
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-2 text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
          {t('axis.chronologicalLabel')}
          <button
            type="button"
            role="switch"
            aria-checked={isChronological}
            onClick={handleAxisToggle}
            className="relative inline-flex items-center rounded-full transition-colors shrink-0"
            style={{ width: 34, height: 20, background: isChronological ? 'var(--color-primary)' : 'var(--muted)' }}
          >
            <span
              aria-hidden="true"
              className="absolute rounded-full transition-transform"
              style={{
                width: 16,
                height: 16,
                top: 2,
                left: 2,
                transform: isChronological ? 'translateX(14px)' : 'translateX(0)',
                background: 'var(--card)',
              }}
            />
          </button>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1 text-xs px-4 py-2.5 rounded-full transition-opacity hover:opacity-70 ml-auto"
            style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
          >
            <X size={12} aria-hidden="true" />
            {t('filters.clear')}
          </button>
        )}
      </div>
    </div>
  )
}
