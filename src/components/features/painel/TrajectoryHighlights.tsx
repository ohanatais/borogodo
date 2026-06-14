import { useTranslations } from 'next-intl'
import type { HighlightEntry } from '@/lib/panel/getPanelData'

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
                  {resultLine}
                </p>
              )}
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {entry.what_i_did}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
