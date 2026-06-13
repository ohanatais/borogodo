'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Reflection } from '@/types/capture'

interface ReflectionCardProps {
  reflection: Reflection
  onEnrich: (answer: string) => void
  onDismiss: () => void
}

export function ReflectionCard({ reflection, onEnrich, onDismiss }: ReflectionCardProps) {
  const t = useTranslations('capture')
  const [answering, setAnswering] = useState(false)
  const [answer, setAnswer] = useState('')

  const isQuestion = reflection.move.type === 'question'

  const handleRespond = () => {
    if (!isQuestion) return
    setAnswering(true)
  }

  const handleSubmitAnswer = () => {
    if (!answer.trim()) return
    onEnrich(answer.trim())
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="text-base leading-relaxed" style={{ color: 'var(--foreground)' }}>
        {reflection.summary}
      </p>

      {reflection.pills.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {reflection.pills.map((pill) => (
            <li
              key={pill}
              className="text-xs font-medium px-3 py-1 rounded-full capitalize"
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              {pill.replace(/_/g, ' ')}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
        {reflection.move.text}
      </p>

      {answering ? (
        <div className="space-y-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t('reflection.answerPlaceholder')}
            className="w-full rounded-xl px-4 py-2 text-sm outline-none"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          />
          <button
            type="button"
            onClick={handleSubmitAnswer}
            disabled={!answer.trim()}
            className="text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-40"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          >
            {t('reflection.respond')}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {isQuestion && (
            <button
              type="button"
              onClick={handleRespond}
              className="text-sm font-semibold px-4 py-2 rounded-full"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
            >
              {t('reflection.respond')}
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm font-medium px-4 py-2 rounded-full"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {t('reflection.saveAsIs')}
          </button>
        </div>
      )}
    </div>
  )
}
