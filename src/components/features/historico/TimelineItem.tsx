'use client'

import { useState } from 'react'
import { ChevronDown, Paperclip } from 'lucide-react'
import type { HistoricoPosition } from '@/lib/historico/getHistoricoData'

interface TimelineItemProps {
  position: HistoricoPosition
  isLast: boolean
}

export function TimelineItem({ position, isLast }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false)

  const bulletText = (entry: HistoricoPosition['entries'][number]) => {
    const parts = [entry.what_i_did]
    if (entry.impact) parts.push(entry.impact)
    return parts.join(' — ')
  }

  return (
    <div className={!isLast ? 'border-b' : ''} style={{ borderColor: 'var(--border)' }}>
      <div className="grid py-5" style={{ gridTemplateColumns: '88px 1fr' }}>
        {/* Rail */}
        <div className="flex flex-col items-center gap-1 relative">
          <div
            className="w-[42px] h-[42px] flex items-center justify-center rounded-full text-sm font-semibold shrink-0"
            style={{
              background: position.company_tint.bg,
              color: position.company_tint.fg,
            }}
            aria-hidden="true"
          >
            {position.company_initials}
          </div>
          <span
            className="text-xs font-bold tabular-nums text-center leading-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            {position.year_label}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 pr-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full text-left flex items-start justify-between gap-2"
            aria-expanded={expanded}
          >
            <div className="min-w-0">
              <h3 className="text-base leading-snug">
                <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {position.role_title}
                </span>
                <span style={{ color: 'var(--muted-foreground)' }}>
                  {' · '}
                  <span className="font-normal">{position.company}</span>
                </span>
              </h3>
              <p
                className="text-sm italic mt-0.5"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {position.period_label}
              </p>
            </div>
            <ChevronDown
              size={16}
              className="shrink-0 mt-1 transition-transform"
              style={{
                color: 'var(--muted-foreground)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Bullets + evidências — only when expanded */}
          {expanded && (
            <>
              {position.entries.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {position.entries.map((entry, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className="mt-[6px] w-1 h-1 rounded-full shrink-0"
                        style={{ background: 'var(--color-accent)' }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-[15px] leading-snug"
                        style={{ color: 'var(--muted-foreground)', textAlign: 'justify' }}
                      >
                        {bulletText(entry)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--color-lilas-nevoa)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  <Paperclip size={13} />
                  Evidências (em breve)
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
