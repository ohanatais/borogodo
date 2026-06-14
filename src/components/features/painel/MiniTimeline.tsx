import { useTranslations } from 'next-intl'
import type { TimelineEntry } from '@/lib/panel/getPanelData'

interface MiniTimelineProps {
  entries: TimelineEntry[]
}

const MS_PER_DAY = 86_400_000
const ONGOING_THRESHOLD_DAYS = 180

function formatPeriod(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  const startYear = start ? new Date(start).getFullYear() : null
  const endYear = end ? new Date(end).getFullYear() : null
  const isOngoing = end ? (Date.now() - new Date(end).getTime()) / MS_PER_DAY < ONGOING_THRESHOLD_DAYS : false
  const endLabel = isOngoing ? 'atual' : endYear ? String(endYear) : null
  const parts = [startYear ? String(startYear) : null, endLabel].filter(Boolean)
  if (parts.length === 0) return null
  if (parts.length === 1) return parts[0]!
  return parts[0] === parts[1] ? parts[0]! : parts.join('–')
}

export function MiniTimeline({ entries }: MiniTimelineProps) {
  const t = useTranslations('panel.timeline')

  if (entries.length === 0) return null

  return (
    <aside aria-label={t('title')}>
      <p className="text-sm font-semibold mb-5" style={{ color: 'var(--muted-foreground)' }}>
        {t('title')}
      </p>

      <div className="relative">
        {/* Continuous dotted vertical line */}
        <span
          className="absolute w-px border-l border-dotted"
          style={{
            borderColor: 'oklch(30% 0.20 320 / 0.25)',
            top: '5px',
            bottom: '2.25rem',
            left: '4px',
          }}
          aria-hidden="true"
        />

        <ul className="flex flex-col">
          {entries.map((entry) => {
            const period = formatPeriod(entry.start_date, entry.end_date)

            return (
              <li key={entry.id} className="relative flex gap-4 pb-9 last:pb-7">
                {/* Timeline dot */}
                <span
                  className="relative z-10 mt-1 w-[9px] h-[9px] rounded-full shrink-0"
                  style={{
                    background: 'var(--color-primary)',
                    boxShadow: '0 0 0 3px var(--background)',
                  }}
                  aria-hidden="true"
                />

                <div className="-mt-0.5 min-w-0">
                  {entry.role_title && (
                    <p
                      className="text-[15px] font-semibold leading-snug"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {entry.role_title}
                    </p>
                  )}
                  {entry.company && (
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {entry.company}
                    </p>
                  )}
                  {period && (
                    <p className="text-xs italic mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {period}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        <p className="relative z-10 ml-[28px] -mt-1" aria-hidden="true">
          <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            {t('viewAll')}
          </span>
        </p>
      </div>
    </aside>
  )
}
