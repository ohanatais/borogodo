'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CalendarClock, ArrowRight } from 'lucide-react'
import type { ReviewCycleSignal } from '@/lib/panel/getReviewCycleSignal'

interface ReviewCycleInviteProps {
  signal: ReviewCycleSignal
}

/**
 * Convite de calendário no painel (019, US2). Quando o ciclo de avaliação se aproxima, convida a
 * ESCREVER a autoavaliação (com dados) ou a REGISTRAR antes (poucos dados, FR-008). Só painel, sem
 * e-mail. Sem recorrência → o sinal é `none` e este componente não renderiza nada (FR-009).
 */
export function ReviewCycleInvite({ signal }: ReviewCycleInviteProps) {
  const t = useTranslations('autoavaliacao.panelInvite')
  if (signal.type !== 'approaching') return null

  const feedFirst = signal.mode === 'feed-first'

  return (
    <Link
      href={feedFirst ? '/registros' : '/autoavaliacao'}
      className="group flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-6 transition-colors"
      style={{ background: 'var(--color-lilas-nevoa)' }}
    >
      <span
        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        <CalendarClock size={18} aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {t('title')}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-lilas-nevoa-text)' }}>
          {feedFirst ? t('feedFirst') : t('write')}
        </p>
      </div>
      <ArrowRight
        size={16}
        aria-hidden="true"
        className="shrink-0 transition-transform group-hover:translate-x-0.5"
        style={{ color: 'var(--color-primary)' }}
      />
    </Link>
  )
}
