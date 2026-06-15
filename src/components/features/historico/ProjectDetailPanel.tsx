'use client'

import { X, Plus, Flag, Trophy } from 'lucide-react'
import type { HistoricoProject } from '@/lib/historico/getHistoricoData'
import { EvidenceSection } from './EvidenceSection'

interface ProjectDetailPanelProps {
  project: HistoricoProject
  company: string
  onClose: () => void
  onStartCapture: () => void
}

function openCorrectionChat(entryId: string, whatIDid: string) {
  window.dispatchEvent(
    new CustomEvent('borogodo:chat-open', {
      detail: {
        context: { type: 'entry', entityId: entryId },
        prefillMessage: `A entrada "${whatIDid.slice(0, 80)}${whatIDid.length > 80 ? '...' : ''}" está incorreta.`,
      },
    })
  )
}

function openMarcoChat(company: string, projectName: string) {
  window.dispatchEvent(
    new CustomEvent('borogodo:chat-open', {
      detail: {
        context: { type: 'empresa', entityId: company },
        prefillMessage: `Quero registrar um marco no projeto "${projectName}" em ${company}.`,
      },
    })
  )
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
            <li key={entry.id} className="space-y-1 group relative">
              <p className="text-[15px] leading-snug font-medium pr-16" style={{ color: 'var(--foreground)' }}>
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

              {/* Visible on mobile; hover-only on desktop */}
              <button
                type="button"
                onClick={() => openCorrectionChat(entry.id, entry.what_i_did)}
                className="absolute top-0 right-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-opacity opacity-70 lg:opacity-0 lg:group-hover:opacity-100"
                style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
                aria-label="Corrigir esta entrada"
              >
                <Flag size={11} />
                corrigir
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Action row */}
      <div className="flex flex-col gap-2 mt-1">
        <div
          className="rounded-xl p-3 flex items-center justify-between gap-3"
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

        <button
          type="button"
          onClick={() => openMarcoChat(company, project.name)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm transition-opacity hover:opacity-80"
          style={{
            background: 'var(--color-lilas-nevoa)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-primary)',
          }}
        >
          <Trophy size={13} />
          Registrar marco neste projeto
        </button>
      </div>
    </div>
  )
}
