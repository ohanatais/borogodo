import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { TimelineEntry } from '@/lib/panel/getPanelData'
import { SectionLabel } from '@/components/ui/SectionLabel'

interface MiniTimelineProps {
  entries: TimelineEntry[]
  showLink?: boolean
}

function formatYear(dateStr: string | null): string | null {
  if (!dateStr) return null
  const year = new Date(dateStr).getFullYear()
  return isNaN(year) ? null : String(year)
}

export function MiniTimeline({ entries, showLink = true }: MiniTimelineProps) {
  const t = useTranslations('panel.timeline')

  if (entries.length === 0) return null

  return (
    <aside aria-label={t('title')} className="md:pl-4">
      <SectionLabel>{t('title')}</SectionLabel>

      <div className="space-y-3">
        {entries.map((entry, i) => {
          const year = formatYear(entry.entry_date)
          const role = [entry.role_title, entry.company].filter(Boolean).join(' · ')

          return (
            <div key={entry.id} className="flex gap-3 items-start">
              {/* Timeline node */}
              <div className="flex flex-col items-center shrink-0 pt-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: i === 0 ? 'var(--color-primary)' : 'var(--border)' }}
                />
                {i < entries.length - 1 && (
                  <div
                    className="w-px h-8 mt-1"
                    style={{
                      background: 'var(--border)',
                      borderLeft: '1px dashed var(--border)',
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 pb-2">
                {year && (
                  <p className="text-xs mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {year}
                  </p>
                )}
                {role && (
                  <p className="text-sm font-medium leading-tight" style={{ color: 'var(--foreground)' }}>
                    {role}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showLink && (
        <Link
          href="/historico"
          className="block mt-4 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('viewAll')} →
        </Link>
      )}
    </aside>
  )
}
