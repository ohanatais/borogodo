import { useTranslations } from 'next-intl'
import type { HighlightEntry } from '@/lib/panel/getPanelData'
import { truncate } from '@/lib/utils'

interface TrajectoryHighlightsProps {
  highlights: HighlightEntry[]
}

export function TrajectoryHighlights({ highlights }: TrajectoryHighlightsProps) {
  const t = useTranslations('panel.highlights')

  if (highlights.length === 0) return null

  return (
    <section aria-label={t('title')} className="mb-4">
      <p
        className="text-xs font-semibold uppercase tracking-widest px-4 mb-2"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {t('title')}
      </p>
      <div className="space-y-2">
        {highlights.map((entry) => {
          const resultLine = [entry.impact, entry.metric].filter(Boolean).join(' · ')
          return (
            <div
              key={entry.id}
              className="px-4 py-3 rounded-lg border"
              style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
            >
              {resultLine && (
                <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--foreground)' }}>
                  {truncate(resultLine, 100)}
                </p>
              )}
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {truncate(entry.what_i_did, 100)}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
