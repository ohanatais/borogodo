'use client'

import { useTranslations } from 'next-intl'
import type { DraftFormat, DraftStatusFilter } from '@/types/content'

interface StatusFilterProps {
  status: DraftStatusFilter
  format: DraftFormat | null
  onStatusChange: (status: DraftStatusFilter) => void
  onFormatChange: (format: DraftFormat | null) => void
}

const STATUS_OPTIONS: { value: DraftStatusFilter; key: string }[] = [
  { value: 'ativos', key: 'filter.ativos' },
  { value: 'copiados', key: 'filter.copiados' },
  { value: 'arquivados', key: 'filter.arquivados' },
]

const FORMAT_OPTIONS: { value: DraftFormat | null; key: string }[] = [
  // 'impact_summary' ("Pra falar") saiu dos formatos oferecidos na 021 — fora do filtro também.
  // Rascunhos antigos desse tipo seguem visíveis em "Todos".
  { value: null, key: 'filter.allFormats' },
  { value: 'post', key: 'filter.post' },
]

function Pill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center justify-center text-xs font-medium px-3 min-h-[48px] md:min-h-[36px] rounded-full border transition-colors"
      style={{
        background: active ? 'var(--color-primary)' : 'var(--card)',
        borderColor: active ? 'var(--color-primary)' : 'var(--border)',
        color: active ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
      }}
    >
      {label}
    </button>
  )
}

/**
 * Filtro discreto do hub (FR-009): recorta a lista por status (ativos/copiados/arquivados) e por
 * formato (post/resumo). A mudança dispara o refetch server-side no `PresencaHub` — o filtro não corta
 * no cliente, para a paginação seguir correta. Numa linha, com rótulos ("Status"/"Formato") para os
 * dois grupos de pílulas serem auto-explicativos; quebra com elegância no mobile.
 */
export function StatusFilter({ status, format, onStatusChange, onFormatChange }: StatusFilterProps) {
  const t = useTranslations('presenca')

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <div role="group" aria-labelledby="presenca-filter-status" className="flex items-center gap-1.5">
        <span id="presenca-filter-status" className="text-xs font-medium mr-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {t('filter.statusLabel')}
        </span>
        {STATUS_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            active={status === opt.value}
            label={t(opt.key)}
            onClick={() => onStatusChange(opt.value)}
          />
        ))}
      </div>
      <div role="group" aria-labelledby="presenca-filter-format" className="flex items-center gap-1.5">
        <span id="presenca-filter-format" className="text-xs font-medium mr-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {t('filter.formatLabel')}
        </span>
        {FORMAT_OPTIONS.map((opt) => (
          <Pill
            key={opt.value ?? 'all'}
            active={format === opt.value}
            label={t(opt.key)}
            onClick={() => onFormatChange(opt.value)}
          />
        ))}
      </div>
    </div>
  )
}
