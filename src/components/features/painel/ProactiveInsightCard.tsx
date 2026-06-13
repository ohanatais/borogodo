'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { markInsightSeen } from '@/lib/actions/insights'
import type { ProactiveInsight } from '@/types/insight'

interface ProactiveInsightCardProps {
  insight: ProactiveInsight | null
}

export function ProactiveInsightCard({ insight }: ProactiveInsightCardProps) {
  const t = useTranslations('panel')
  const cardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!insight || insight.seen) return

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
  }, [insight])

  if (!insight) return null

  return (
    <section
      ref={cardRef}
      className="mx-6 my-4 space-y-2 rounded-2xl border p-5"
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
