import { useTranslations } from 'next-intl'
import type { HighlightEntry } from '@/lib/panel/getPanelData'
import { SectionLabel } from '@/components/ui/SectionLabel'

interface TrajectoryHighlightsProps {
  highlights: HighlightEntry[]
}

export function TrajectoryHighlights({ highlights }: TrajectoryHighlightsProps) {
  const t = useTranslations('panel.highlights')

  if (highlights.length === 0) return null

  return (
    <section aria-label={t('title')} className="mb-4">
      <SectionLabel className="px-4">{t('title')}</SectionLabel>
      <div className="space-y-2">
        {highlights.map((entry) => (
          <div
            key={entry.id}
            className="px-4 py-3 rounded-lg border"
            style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
          >
            {entry.metric && (
              <span
                className="inline-block px-2 py-0.5 rounded text-xs font-semibold mb-1.5"
                style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-primary)' }}
              >
                {entry.metric}
              </span>
            )}
            <p
              className="text-sm font-semibold leading-snug mb-0.5"
              style={{ color: 'var(--foreground)' }}
            >
              {entry.what_i_did}
            </p>
            {entry.impact && (
              <p
                className="text-xs leading-snug line-clamp-2"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {entry.impact}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
