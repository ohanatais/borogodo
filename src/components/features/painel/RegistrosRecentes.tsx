import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { EntrySource } from '@/types/entry'

interface RegistroRecente {
  id: string
  what_i_did: string
  title?: string | null
  source: EntrySource
  entry_date?: string | null
  created_at: string
  metric?: string | null
  company?: string | null
}

interface RegistrosRecentesProps {
  entries: RegistroRecente[]
}

const MAX_VISIBLE_ENTRIES = 3

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/**
 * "Registros recentes" (US5) — até 3 registros, card discreto com métrica em destaque + data +
 * empresa (design-brief §5/§6). Substitui `RecentEntries` no Painel: mesma fonte de dados
 * (`getPanelData`), visual mais compacto e sem o link de item completo do feed.
 */
export function RegistrosRecentes({ entries }: RegistrosRecentesProps) {
  const t = useTranslations('painel.registrosRecentes')

  if (entries.length === 0) return null

  const visible = entries.slice(0, MAX_VISIBLE_ENTRIES)

  return (
    <section aria-label={t('title')}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-primary)' }}
        >
          {t('title')}
        </h2>
        <Link
          href="/registros"
          className="group inline-flex items-center gap-1 text-sm font-medium shrink-0 transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('viewAll')}
          <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {visible.map((entry) => {
          const label = entry.title?.trim() || entry.what_i_did
          const dateLabel = formatDate(entry.entry_date ?? entry.created_at)

          return (
            <li
              key={entry.id}
              className="rounded-xl px-4 py-3 border"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <p className="text-sm font-medium line-clamp-1" style={{ color: 'var(--foreground)' }}>
                {label}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs flex-wrap" style={{ color: 'var(--muted-foreground)' }}>
                {entry.metric && (
                  <span className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>
                    {entry.metric}
                  </span>
                )}
                <span>{dateLabel}</span>
                {entry.company && <span>· {entry.company}</span>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
