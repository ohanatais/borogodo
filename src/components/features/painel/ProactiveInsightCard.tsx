'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { markInsightSeen } from '@/lib/actions/insights'
import { openPresenca } from '@/components/features/content/presencaEvents'
import type { ProactiveInsight } from '@/types/insight'
import type { DraftFormat } from '@/types/content'

interface ProactiveInsightCardProps {
  insight: ProactiveInsight | null
}

const NUDGE_FORMATS: DraftFormat[] = ['post', 'impact_summary']

export function ProactiveInsightCard({ insight }: ProactiveInsightCardProps) {
  const t = useTranslations('panel')
  const tn = useTranslations('presenca')
  const te = useTranslations('panel.enrichment')
  const router = useRouter()
  const cardRef = useRef<HTMLElement>(null)
  const isContentNudge = insight?.type === 'content_opportunity'
  const isEnrichmentNudge = insight?.type === 'enrichment_nudge'
  const isNudge = isContentNudge

  useEffect(() => {
    // Insight comum marca `seen` ao aparecer; o nudge (014) só marca ao ser interagido (FR-015).
    if (!insight || insight.seen || isNudge) return

    const el = cardRef.current
    if (!el) return

    let fired = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !fired) {
          fired = true
          void markInsightSeen(insight.id)
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [insight, isNudge])

  if (!insight) return null

  // Pergunta cirúrgica assíncrona (016 US4): enriquece entrada magra fora do momento da captura.
  if (isEnrichmentNudge) {
    return (
      <EnrichmentNudgeCard
        insight={insight}
        question={te('question')}
        answerPlaceholder={te('answerPlaceholder')}
        respondLabel={te('respond')}
        dismissLabel={te('dismiss')}
        onDone={() => router.refresh()}
      />
    )
  }

  // Nudge "isso daria um post" (US4 anterior / 014): convida a gerar a partir da entrada forte, nunca gera sozinho.
  if (isNudge) {
    const entryId = insight.entry_ids[0]
    const handleUse = () => {
      if (entryId) {
        openPresenca({ seedType: 'entry', seedRef: entryId, seedSummary: insight.headline, formats: NUDGE_FORMATS })
      }
      void markInsightSeen(insight.id)
    }

    return (
      <section
        className="mb-6 flex flex-col gap-2 rounded-2xl border p-5"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--color-accent-text)' }}>
          {tn('nudge.label')}
        </span>
        <p className="text-base" style={{ color: 'var(--foreground)' }}>
          {insight.headline}
        </p>
        <button
          type="button"
          onClick={handleUse}
          className="self-start inline-flex items-center text-sm font-medium px-4 py-2 min-h-[48px] rounded-full transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          {tn('nudge.cta')}
        </button>
      </section>
    )
  }

  return (
    <section
      ref={cardRef}
      className="mb-6 space-y-2 rounded-2xl border p-5"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
        {t('insight.label')}
      </span>
      <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
        {insight.headline}
      </p>
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {insight.body}
      </p>
    </section>
  )
}

// ─── EnrichmentNudgeCard ──────────────────────────────────────────────────────

interface EnrichmentNudgeCardProps {
  insight: ProactiveInsight
  question: string
  answerPlaceholder: string
  respondLabel: string
  dismissLabel: string
  onDone: () => void
}

function EnrichmentNudgeCard({
  insight,
  question,
  answerPlaceholder,
  respondLabel,
  dismissLabel,
  onDone,
}: EnrichmentNudgeCardProps) {
  const [answer, setAnswer] = useState('')
  const [sending, setSending] = useState(false)
  const entryId = insight.entry_ids[0]

  async function handleRespond() {
    if (!answer.trim() || !entryId) return
    setSending(true)
    try {
      await fetch(`/api/entries/${entryId}/enrich`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'metric', answer: answer.trim() }),
      })
      await markInsightSeen(insight.id)
      onDone()
    } finally {
      setSending(false)
    }
  }

  async function handleDismiss() {
    await markInsightSeen(insight.id)
    onDone()
  }

  return (
    <section
      className="mb-6 rounded-2xl border px-4 py-3"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {question}
        </p>
        <button
          type="button"
          onClick={() => void handleDismiss()}
          aria-label={dismissLabel}
          className="text-xs shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--muted-foreground)' }}
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="enrichment-answer" className="sr-only">{question}</label>
        <input
          id="enrichment-answer"
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={answerPlaceholder}
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none min-h-[36px]"
          style={{
            background: 'var(--muted)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleRespond()
            }
          }}
        />
        <button
          type="button"
          onClick={() => void handleRespond()}
          disabled={!answer.trim() || sending}
          aria-label={respondLabel}
          className="px-3 py-2 rounded-lg text-sm font-medium min-h-[36px] disabled:opacity-40 transition-opacity shrink-0"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          {respondLabel}
        </button>
      </div>
    </section>
  )
}
