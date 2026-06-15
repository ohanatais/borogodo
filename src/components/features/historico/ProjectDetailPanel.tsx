import { X, Plus } from 'lucide-react'
import type { HistoricoProject } from '@/lib/historico/getHistoricoData'
import { EvidenceSection } from './EvidenceSection'

interface ProjectDetailPanelProps {
  project: HistoricoProject
  company: string
  onClose: () => void
  onStartCapture: () => void
}

export function ProjectDetailPanel({
  project,
  company,
  onClose,
  onStartCapture,
}: ProjectDetailPanelProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 h-fit"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className="text-base font-bold leading-snug"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {project.name}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {company}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel"
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Entry list */}
      {project.entries.length > 0 && (
        <ul className="space-y-5">
          {project.entries.map((entry) => (
            <li key={entry.id} className="space-y-1">
              <p className="text-[15px] leading-snug font-medium" style={{ color: 'var(--foreground)' }}>
                {entry.what_i_did}
              </p>
              {entry.impact && (
                <p className="text-sm leading-snug" style={{ color: 'var(--muted-foreground)' }}>
                  {entry.impact}
                </p>
              )}
              {entry.metric && (
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                  style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-primary)' }}
                >
                  {entry.metric}
                </span>
              )}
              <EvidenceSection entryId={entry.id} initial={entry.evidences} />
            </li>
          ))}
        </ul>
      )}

      {/* Capture invite */}
      <div
        className="rounded-xl p-3 flex items-center justify-between gap-3 mt-1"
        style={{ background: 'var(--muted)' }}
      >
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Tem mais sobre esse projeto?
        </p>
        <button
          type="button"
          onClick={onStartCapture}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          <Plus size={12} />
          Adicionar via captura
        </button>
      </div>
    </div>
  )
}
