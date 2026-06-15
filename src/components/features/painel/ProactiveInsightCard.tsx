'use client'

import { useEffect, useRef } from 'react'
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
  const cardRef = useRef<HTMLElement>(null)
  const isNudge = insight?.type === 'content_opportunity'

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

  // Nudge "isso daria um post" (US4): convida a gerar a partir da entrada forte, nunca gera sozinho.
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
