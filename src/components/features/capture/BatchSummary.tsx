'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CheckCircle2, RotateCcw, Trash2 } from 'lucide-react'
import type { BatchEntry } from '@/types/capture'

interface BatchSummaryProps {
  entries: BatchEntry[]
  /** Desfazer tudo (remove todas as entradas criadas). */
  onUndone: () => void
  /** Saída positiva — encerra a captura aceitando o que ficou. */
  onDone: () => void
}

type State = 'idle' | 'undoing' | 'undone' | 'error'

/** Título a exibir: o título gerado, ou o what_i_did como fallback. */
function entryLabel(entry: BatchEntry): string {
  return entry.title?.trim() || entry.what_i_did
}

/** Empresa comum a todas as entradas, ou null quando varia/ausente. */
function sharedCompany(items: BatchEntry[]): string | null {
  const companies = items.map((item) => item.company).filter((c): c is string => Boolean(c))
  if (companies.length !== items.length) return null
  return new Set(companies).size === 1 ? companies[0] : null
}

export function BatchSummary({ entries, onUndone, onDone }: BatchSummaryProps) {
  const t = useTranslations('capture')
  const router = useRouter()
  const [items, setItems] = useState<BatchEntry[]>(entries)
  const [state, setState] = useState<State>('idle')

  async function handleDiscard(id: string) {
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) return
    const removed = items[index]
    const remaining = items.filter((item) => item.id !== id)

    // Otimista: tira da lista já; em falha, recoloca na posição original.
    setItems(remaining)
    setState('idle')

    try {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      router.refresh()
      if (remaining.length === 0) {
        setState('undone')
        onUndone()
      }
    } catch {
      setItems((prev) => {
        const restored = [...prev]
        restored.splice(index, 0, removed)
        return restored
      })
      setState('error')
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

  function handleViewFeed() {
    router.push('/registros')
    onDone()
  }

  if (state === 'undone') {
    return (
      <p role="status" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {t('batch.undone')}
      </p>
    )
  }

  const n = items.length
  const company = sharedCompany(items)

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl px-5 py-4 max-w-sm w-full"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex flex-col gap-0.5">
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
        <p className="text-xs pl-7" style={{ color: 'var(--muted-foreground)' }}>
          {company ? t('batch.reviewHintCompany', { company }) : t('batch.reviewHint')}
        </p>
      </div>

      <ul className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm line-clamp-2" style={{ color: 'var(--foreground)' }}>
                {entryLabel(item)}
              </p>
              {!company && item.company && (
                <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                  {item.company}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void handleDiscard(item.id)}
              aria-label={t('batch.discardAriaLabel', { title: entryLabel(item) })}
              title={t('batch.discard')}
              className="flex items-center justify-center rounded-full transition-colors shrink-0 w-11 h-11 -my-1.5 hover:bg-[var(--card)]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {state === 'error' && (
        <p role="alert" className="text-xs" style={{ color: 'var(--destructive)' }}>
          {t('error.message')}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleViewFeed}
          className="text-sm font-semibold px-4 py-2 rounded-full min-h-[44px]"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          {t('batch.viewFeed')}
        </button>
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
