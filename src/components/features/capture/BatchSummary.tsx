'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CheckCircle2, RotateCcw, X } from 'lucide-react'
import type { BatchEntry } from '@/types/capture'

interface BatchSummaryProps {
  entries: BatchEntry[]
  onUndone: () => void
}

type State = 'idle' | 'undoing' | 'undone' | 'error'

/** Título a exibir: o título gerado, ou o what_i_did como fallback. */
function entryLabel(entry: BatchEntry): string {
  return entry.title?.trim() || entry.what_i_did
}

export function BatchSummary({ entries, onUndone }: BatchSummaryProps) {
  const t = useTranslations('capture')
  const router = useRouter()
  const [items, setItems] = useState<BatchEntry[]>(entries)
  const [state, setState] = useState<State>('idle')
  const [discardingId, setDiscardingId] = useState<string | null>(null)

  async function handleDiscard(id: string) {
    setDiscardingId(id)
    try {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      const remaining = items.filter((item) => item.id !== id)
      setItems(remaining)
      router.refresh()
      if (remaining.length === 0) {
        setState('undone')
        onUndone()
      }
    } catch {
      setState('error')
    } finally {
      setDiscardingId(null)
    }
  }

  async function handleUndoAll() {
    setState('undoing')
    try {
      const res = await fetch('/api/entries/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: items.map((item) => item.id) }),
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
      <p role="status" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {t('batch.undone')}
      </p>
    )
  }

  const n = items.length

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl px-5 py-4 max-w-sm w-full"
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

      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>
                {entryLabel(item)}
              </p>
              {item.company && (
                <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                  {item.company}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void handleDiscard(item.id)}
              disabled={discardingId === item.id}
              aria-label={t('batch.discardAriaLabel', { title: entryLabel(item) })}
              className="flex items-center justify-center rounded-full transition-opacity disabled:opacity-50 shrink-0 w-11 h-11 -my-1.5"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {state === 'error' && (
        <p role="alert" className="text-xs" style={{ color: 'oklch(55% 0.22 25)' }}>
          {t('error.message')}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleUndoAll()}
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
