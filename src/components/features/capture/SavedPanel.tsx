'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Pencil, Sparkles } from 'lucide-react'
import { AttachTile } from './AttachTile'
import type { DrawerAttachment } from '@/hooks/useDrawerDraft'

interface SavedPanelProps {
  entryId: string
  initialTitle: string
  attachments?: DrawerAttachment[]
  onRetryAttachment?: (id: string) => void
  onDone: () => void
}

/**
 * Confirmação editável após salvar (US3) — loop de confiança fechado, nunca "registra às
 * cegas" (FR-010/FR-011). Aparece assim que `saveDeposito` retorna, mesmo que os anexos ainda
 * estejam subindo em segundo plano (T038); falhas de anexo são sinalizadas por tile, sem reabrir
 * o drawer (contracts/capture.md).
 */
export function SavedPanel({ entryId, initialTitle, attachments = [], onRetryAttachment, onDone }: SavedPanelProps) {
  const t = useTranslations('registro')
  const [title, setTitle] = useState(initialTitle)
  const [saving, setSaving] = useState(false)

  async function persistTitle(nextTitle: string) {
    const trimmed = nextTitle.trim()
    if (!trimmed || trimmed === initialTitle) return

    setSaving(true)
    try {
      await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={20} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {t('savedPanel.confirmation')}
        </p>
      </div>

      {/* US3 (feature 026, T040): registro já está salvo e visível — a organização (métrica/
          impacto/tags/título) roda em segundo plano sem bloquear nem exigir nenhuma ação aqui. */}
      <div className="flex items-center gap-1.5 text-xs px-0.5" style={{ color: 'var(--muted-foreground)' }}>
        <Sparkles size={13} aria-hidden="true" />
        <span>{t('savedPanel.organizingHint')}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="saved-panel-title" className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
          {t('savedPanel.titleLabel')}
        </label>
        <div className="relative">
          <input
            id="saved-panel-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={(e) => void persistTitle(e.target.value)}
            aria-label={t('savedPanel.titleAriaLabel')}
            disabled={saving}
            className="w-full rounded-xl pl-3 pr-9 py-2.5 text-sm outline-none"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
          <Pencil size={13} aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
        </div>
        <p className="text-xs px-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {t('savedPanel.titleHint')}
        </p>
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <AttachTile
              key={att.id}
              kind={att.kind}
              previewUrl={att.previewUrl}
              label={att.label}
              status={att.status}
              onRetry={att.status === 'error' ? () => onRetryAttachment?.(att.id) : undefined}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onDone}
        className="self-end px-4 py-2 rounded-xl text-sm font-semibold"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        {t('savedPanel.doneButton')}
      </button>
    </div>
  )
}
