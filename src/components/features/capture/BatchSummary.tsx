'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CheckCircle2, RotateCcw } from 'lucide-react'

interface BatchSummaryProps {
  ids: string[]
  onUndone: () => void
}

type State = 'idle' | 'undoing' | 'undone' | 'error'

export function BatchSummary({ ids, onUndone }: BatchSummaryProps) {
  const t = useTranslations('capture')
  const router = useRouter()
  const [state, setState] = useState<State>('idle')
  const n = ids.length

  async function handleUndo() {
    setState('undoing')
    try {
      const res = await fetch('/api/entries/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error('delete failed')
      setState('undone')
      router.refresh()
      onUndone()
    } catch {
      setState('error')
    }
  }

  if (state === 'undone') {
    return (
      <p
        role="status"
        className="text-sm"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {t('batch.undone')}
      </p>
    )
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl px-5 py-4 max-w-sm"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2
          size={18}
          aria-hidden="true"
          style={{ color: 'var(--color-primary)', flexShrink: 0 }}
        />
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {t('batch.summary', { n })}
        </p>
      </div>

      {state === 'error' && (
        <p role="alert" className="text-xs" style={{ color: 'oklch(55% 0.22 25)' }}>
          {t('error.message')}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleUndo()}
          disabled={state === 'undoing'}
          aria-label={t('batch.undoAriaLabel', { n })}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full transition-opacity disabled:opacity-50 min-h-[44px]"
          style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
        >
          <RotateCcw size={14} aria-hidden="true" />
          {t('batch.undo')}
        </button>
      </div>
    </div>
  )
}
