'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { truncate } from '@/lib/utils'
import type { HighlightEntry } from '@/lib/panel/getPanelData'

interface TrajectoryHighlightsProps {
  highlights: HighlightEntry[]
}

const PREVIEW_LENGTH = 80

export function TrajectoryHighlights({ highlights }: TrajectoryHighlightsProps) {
  const t = useTranslations('panel.highlights')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (highlights.length === 0) return null

  return (
    <section aria-label={t('title')} className="mb-6">
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
        {t('title')}
      </p>

      <ul>
        {highlights.map((entry, i) => {
          const resultLine = [entry.impact, entry.metric].filter(Boolean).join(' · ')
          const isExpanded = expandedId === entry.id
          const isLong = entry.what_i_did.length > PREVIEW_LENGTH
          const evidenceText = isExpanded || !isLong
            ? entry.what_i_did
            : truncate(entry.what_i_did, PREVIEW_LENGTH)

          return (
            <li
              key={entry.id}
              className={`flex items-start gap-4 py-4 ${i > 0 ? 'border-t' : ''}`}
              style={{ borderColor: 'var(--border)' }}
            >
              <span
                className="mt-[9px] w-2 h-2 rounded-full shrink-0"
                style={{ background: 'var(--color-accent)' }}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                {resultLine && (
                  <p
                    className="font-display text-lg font-semibold leading-snug"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {resultLine}
                  </p>
                )}
                <p
                  className="text-sm leading-relaxed mt-0.5 max-w-[58ch]"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {evidenceText}
                </p>
                {isLong && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    aria-expanded={isExpanded}
                    className="flex items-center gap-1 mt-2 text-xs font-medium transition-colors"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    <ChevronDown
                      size={14}
                      aria-hidden="true"
                      style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms ease-out',
                      }}
                    />
                    {isExpanded ? t('collapse') : t('expand')}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
