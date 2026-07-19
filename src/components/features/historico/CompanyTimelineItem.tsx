'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { HistoricoCompany } from '@/lib/historico/getHistoricoData'

interface CompanyTimelineItemProps {
  company: HistoricoCompany
  isLast: boolean
}

export function CompanyTimelineItem({
  company,
  isLast,
}: CompanyTimelineItemProps) {
  const [expanded, setExpanded] = useState(false)

  const companyId = `company-${company.company.replace(/\s+/g, '-').toLowerCase()}`

  const collapsedLabel =
    company.roles.length === 1
      ? `${company.roles[0].role_title} · ${company.company}`
      : company.company

  return (
    <div className={!isLast ? 'border-b' : ''} style={{ borderColor: 'var(--border)' }}>
      <div className="grid py-5" style={{ gridTemplateColumns: '88px 1fr' }}>
        {/* Rail */}
        <div className="flex flex-col items-center gap-1 relative">
          <div
            className="w-[42px] h-[42px] flex items-center justify-center rounded-full text-sm font-semibold shrink-0"
            style={{
              background: company.company_tint.bg,
              color: company.company_tint.fg,
            }}
            aria-hidden="true"
          >
            {company.company_initials}
          </div>
          <span
            className="text-xs font-bold tabular-nums text-center leading-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            {company.year_label}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 pr-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full text-left flex items-start justify-between gap-2"
            aria-expanded={expanded}
            aria-controls={companyId}
          >
            <div className="min-w-0">
              <h3
                className="text-base leading-snug font-bold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {collapsedLabel}
              </h3>
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

          {expanded && (
            <div id={companyId} className="mt-3 space-y-3">
              {/* Role progression (only if 2+ roles) */}
              {company.roles.length >= 2 && (
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {company.roles
                    .slice(0, 4)
                    .map((r) => `${r.role_title} ${r.year_label}`)
                    .join('  ·  ')}
                </p>
              )}

              {/* Highlight bullets */}
              {company.highlight_bullets.length > 0 && (
                <ul className="space-y-2">
                  {company.highlight_bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className="mt-[6px] w-1 h-1 rounded-full shrink-0"
                        style={{ background: 'var(--color-accent)' }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-[15px] leading-snug"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
