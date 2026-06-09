'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { CaptureInput, Reflection } from '@/types/capture'
import { ReadingState } from './ReadingState'
import { ReflectionCard } from './ReflectionCard'

interface CaptureConversationProps {
  input: CaptureInput
  onResolved: () => void
}

type Phase = 'reading' | 'reflecting' | 'error'

function buildFormData(input: CaptureInput): FormData {
  const formData = new FormData()
  formData.set('kind', input.kind)

  if (input.kind === 'text') {
    formData.set('content', input.content)
  } else if (input.kind === 'file' || input.kind === 'image') {
    formData.set('file', input.file)
  } else if (input.kind === 'audio') {
    formData.set('file', input.blob, 'audio.webm')
  }

  return formData
}

export function CaptureConversation({ input, onResolved }: CaptureConversationProps) {
  const router = useRouter()
  const t = useTranslations('capture')
  const [phase, setPhase] = useState<Phase>('reading')
  const [reflection, setReflection] = useState<Reflection | null>(null)
  const [entryId, setEntryId] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onResolved()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setPhase('reading')
      setServerError(null)
      try {
        const res = await fetch('/api/capture', { method: 'POST', body: buildFormData(input) })
        if (cancelled) return
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string }
          if (!cancelled) setServerError(body.error ?? null)
          setPhase('error')
          return
        }
        const data = (await res.json()) as { entries: Array<{ id: string }>; reflection: Reflection | null }
        if (cancelled) return
        if (!data.reflection) {
          onResolved()
          return
        }
        setReflection(data.reflection)
        setEntryId(data.entries[0]?.id ?? null)
        setPhase('reflecting')
        router.refresh()
      } catch {
        if (!cancelled) setPhase('error')
      }
    }

    run()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, retryCount])

  const handleEnrich = async (answer: string) => {
    if (entryId && reflection) {
      await fetch(`/api/entries/${entryId}/enrich`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, field: reflection.move.field }),
      })
    }
    router.refresh()
    onResolved()
  }

  const handleDismiss = () => {
    router.refresh()
    onResolved()
  }

  const handleRetry = () => {
    setReflection(null)
    setEntryId(null)
    setServerError(null)
    setRetryCount((n) => n + 1)
  }

  const userBubbleText =
    input.kind === 'text'
      ? input.content
      : input.kind === 'file'
        ? input.file.name
        : t('reading')

  return (
    <motion.div
      ref={dialogRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col outline-none"
      style={{ background: 'var(--background)' }}
    >
      {/* top bar */}
      <div className="flex justify-end px-6 py-4 shrink-0">
        <button
          type="button"
          onClick={handleDismiss}
          className="text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: 'var(--muted-foreground)' }}
          aria-label={t('error.close')}
        >
          ×
        </button>
      </div>

      {/* chat thread — anchored to the bottom */}
      <div className="flex-1 flex flex-col justify-end overflow-y-auto px-4 pb-8 gap-6">
        {/* user message */}
        <div className="flex justify-end">
          <div
            className="max-w-xs rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          >
            {userBubbleText}
          </div>
        </div>

        {/* AI response */}
        <div className="flex justify-start">
          {phase === 'reading' && <ReadingState />}
          {phase === 'reflecting' && reflection && (
            <ReflectionCard reflection={reflection} onEnrich={handleEnrich} onDismiss={handleDismiss} />
          )}
          {phase === 'error' && (
            <div className="space-y-4 max-w-sm">
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                {serverError ?? t('error.message')}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="text-sm font-semibold px-4 py-2 rounded-full"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                >
                  {t('error.retry')}
                </button>
                <button
                  type="button"
                  onClick={onResolved}
                  className="text-sm font-medium px-4 py-2 rounded-full"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {t('error.close')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
