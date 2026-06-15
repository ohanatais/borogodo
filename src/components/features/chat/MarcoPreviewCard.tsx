'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { MarcoPreview } from '@/lib/ai/chat/answerCareerQuestion'

const FIELD_LABELS: Array<{ key: keyof MarcoPreview; label: string }> = [
  { key: 'what_i_did', label: 'Marco' },
  { key: 'company', label: 'Empresa' },
  { key: 'role_title', label: 'Cargo' },
  { key: 'entry_date', label: 'Data' },
  { key: 'impact', label: 'Impacto' },
  { key: 'metric', label: 'Métrica' },
]

interface MarcoPreviewCardProps {
  marco: MarcoPreview
  onConfirm: () => void
  onCancel: () => void
}

export function MarcoPreviewCard({ marco, onConfirm, onCancel }: MarcoPreviewCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleConfirm() {
    setStatus('loading')
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'text',
          content: [
            marco.what_i_did,
            marco.impact && `Impacto: ${marco.impact}`,
            marco.metric && `Métrica: ${marco.metric}`,
          ].filter(Boolean).join('\n'),
          company: marco.company,
          role_title: marco.role_title,
          entry_date: marco.entry_date,
        }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setStatus('done')
      onConfirm()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          <Check size={14} style={{ color: 'var(--color-primary)' }} />
          Marco salvo.
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
        Salvar marco
      </p>

      <ul className="space-y-1.5">
        {FIELD_LABELS.map(({ key, label }) => {
          const value = marco[key]
          if (!value) return null
          return (
            <li key={key} className="text-sm">
              <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {label}:{' '}
              </span>
              <span style={{ color: 'var(--foreground)' }}>{value}</span>
            </li>
          )
        })}
      </ul>

      {status === 'error' && (
        <p className="text-xs" style={{ color: 'oklch(55% 0.2 25)' }}>
          Não foi possível salvar. Tenta de novo?
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={status === 'loading'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          <Check size={12} /> {status === 'loading' ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={status === 'loading'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
          style={{ color: 'var(--muted-foreground)', background: 'var(--card)' }}
        >
          <X size={12} /> Não salvar
        </button>
      </div>
    </div>
  )
}
