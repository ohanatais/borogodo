'use client'

import { useState } from 'react'
import { ChevronDown, ArrowUpRight, MessageSquare } from 'lucide-react'
import type { HistoricoCompany, HistoricoProject } from '@/lib/historico/getHistoricoData'

interface CompanyTimelineItemProps {
  company: HistoricoCompany
  activeProjectName: string | null
  onSelectProject: (project: HistoricoProject) => void
  isLast: boolean
}

export function CompanyTimelineItem({
  company,
  activeProjectName,
  onSelectProject,
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

              {/* Project chips */}
              {company.projects.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {company.projects.map((project) => {
                    const isActive = activeProjectName === project.name
                    return (
                      <button
                        key={project.name}
                        type="button"
                        onClick={() => onSelectProject(project)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors"
                        style={{
                          background: isActive
                            ? 'var(--color-primary)'
                            : 'var(--color-lilas-nevoa)',
                          color: isActive
                            ? 'var(--color-primary-fg)'
                            : 'var(--foreground)',
                        }}
                        aria-pressed={isActive}
                      >
                        {project.name}
                        <ArrowUpRight size={12} />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Ask about company */}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('borogodo:chat-open', {
                      detail: {
                        context: { type: 'empresa', entityId: company.company },
                        prefillMessage: `O que posso destacar do meu tempo em ${company.company}?`,
                      },
                    })
                  )
                }}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2.5 min-h-[44px] rounded-lg transition-opacity hover:opacity-80 mt-1"
                style={{
                  background: 'var(--color-lilas-nevoa)',
                  color: 'var(--color-primary)',
                  border: '1px solid transparent',
                }}
              >
                <MessageSquare size={12} />
                Perguntar sobre {company.company}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
