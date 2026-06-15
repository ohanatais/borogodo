'use client'

import { useState } from 'react'
import { Check, Trash2, X } from 'lucide-react'
import type { CorrectionAction } from '@/lib/ai/chat/answerCareerQuestion'

const FIELD_LABELS: Record<string, string> = {
  what_i_did: 'O que fiz',
  company: 'Empresa',
  role_title: 'Cargo',
  entry_date: 'Data',
  impact: 'Impacto',
  metric: 'Métrica',
  decision: 'Decisão',
  learning: 'Aprendizado',
}

interface CorrectionConfirmCardProps {
  correction: CorrectionAction
  onConfirm: () => void
  onCancel: () => void
}

export function CorrectionConfirmCard({ correction, onConfirm, onCancel }: CorrectionConfirmCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [showMirrorPrompt, setShowMirrorPrompt] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const mirrorFields = ['what_i_did', 'impact', 'metric', 'company']
  const affectsMirror = Object.keys(correction.fields).some((f) => mirrorFields.includes(f))

  async function handleConfirm() {
    setStatus('loading')
    try {
      if (correction.action === 'delete') {
        const res = await fetch(`/api/entries/${correction.entryId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Erro ao remover')
      } else {
        const res = await fetch(`/api/entries/${correction.entryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(correction.fields),
        })
        if (!res.ok) throw new Error('Erro ao atualizar')
      }
      setStatus('done')
      if (affectsMirror && correction.action !== 'delete') {
        setShowMirrorPrompt(true)
      }
      onConfirm()
    } catch {
      setStatus('error')
    }
  }

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      await fetch('/api/mirror/generate', { method: 'POST' })
    } finally {
      setRegenerating(false)
      setShowMirrorPrompt(false)
    }
  }

  if (status === 'done') {
    return (
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          <Check size={14} style={{ color: 'var(--color-primary)' }} />
          {correction.action === 'delete' ? 'Entrada removida.' : 'Correção aplicada.'}
        </div>
        {showMirrorPrompt && (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Isso pode afetar seu espelho. Quer regenerar agora?
            </p>
            <button
              type="button"
              onClick={() => void handleRegenerate()}
              disabled={regenerating}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
            >
              {regenerating ? 'Gerando...' : 'Regenerar espelho'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
        {correction.action === 'delete' ? 'Remover entrada' : 'Confirmar correção'}
      </p>

      {correction.action !== 'delete' && Object.keys(correction.fields).length > 0 && (
        <ul className="space-y-1.5">
          {Object.entries(correction.fields).map(([key, value]) => (
            <li key={key} className="text-sm">
              <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {FIELD_LABELS[key] ?? key}:{' '}
              </span>
              <span style={{ color: 'var(--foreground)' }}>{value}</span>
            </li>
          ))}
        </ul>
      )}

      {correction.action === 'delete' && (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Esta entrada será removida permanentemente.
        </p>
      )}

      {status === 'error' && (
        <p className="text-xs" style={{ color: 'oklch(55% 0.2 25)' }}>
          Não foi possível aplicar a correção. Tente de novo.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={status === 'loading'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{
            background: correction.action === 'delete' ? 'oklch(55% 0.2 25)' : 'var(--color-primary)',
            color: 'var(--color-primary-fg)',
          }}
        >
          {correction.action === 'delete' ? (
            <><Trash2 size={12} /> {status === 'loading' ? 'Removendo...' : 'Remover'}</>
          ) : (
            <><Check size={12} /> {status === 'loading' ? 'Aplicando...' : 'Confirmar'}</>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={status === 'loading'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
          style={{ color: 'var(--muted-foreground)', background: 'var(--card)' }}
        >
          <X size={12} /> Cancelar
        </button>
      </div>
    </div>
  )
}
