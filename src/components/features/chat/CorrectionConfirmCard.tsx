'use client'

import { useState } from 'react'
import { Check, Trash2, RefreshCw } from 'lucide-react'
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

const MIRROR_FIELDS = new Set(['what_i_did', 'impact', 'metric', 'company'])

interface CorrectionConfirmCardProps {
  correction: CorrectionAction
  onDismiss: () => void
}

export function CorrectionConfirmCard({ correction, onDismiss }: CorrectionConfirmCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [showMirrorPrompt, setShowMirrorPrompt] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const affectsMirror = Object.keys(correction.fields).some((f) => MIRROR_FIELDS.has(f))

  async function handleConfirm() {
    setStatus('loading')
    try {
      if (correction.action === 'delete') {
        const res = await fetch(`/api/entries/${correction.entryId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Erro ao remover')
      } else if (correction.action === 'enrich') {
        const [field, answer] = Object.entries(correction.fields)[0] ?? []
        if (!field || !answer) throw new Error('Campo de enriquecimento inválido')
        const res = await fetch(`/api/entries/${correction.entryId}/enrich`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field, answer }),
        })
        if (!res.ok) throw new Error('Erro ao enriquecer')
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
          <div className="space-y-2 pt-1">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Isso pode afetar seu espelho. Quer regenerar agora?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleRegenerate()}
                disabled={regenerating}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
              >
                <RefreshCw size={11} className={regenerating ? 'animate-spin' : ''} />
                {regenerating ? 'Gerando...' : 'Regenerar espelho'}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Agora não
              </button>
            </div>
          </div>
        )}

        {!showMirrorPrompt && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Fechar
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
    >
      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
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
        <p className="text-xs" style={{ color: 'var(--destructive)' }}>
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
            background: correction.action === 'delete' ? 'var(--destructive)' : 'var(--color-primary)',
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
          onClick={onDismiss}
          disabled={status === 'loading'}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
          style={{ color: 'var(--muted-foreground)', background: 'var(--card)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
