'use client'

import { useTranslations } from 'next-intl'
import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import type { ReturnSignal } from '@/lib/panel/getPanelData'

interface ReturnHighlightProps {
  signal: ReturnSignal
  strengthTheme?: string | null
  onCapture?: () => void
}

function formatRelativeTime(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days < 1) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return 'há 1 semana'
  if (weeks < 4) return `há ${weeks} semanas`
  const months = Math.floor(days / 30)
  if (months === 1) return 'há 1 mês'
  if (months < 12) return `há ${months} meses`
  const years = Math.floor(days / 365)
  return years === 1 ? 'há 1 ano' : `há ${years} anos`
}

export function ReturnHighlight({ signal, strengthTheme, onCapture }: ReturnHighlightProps) {
  const t = useTranslations('panel.return')
  const prefersReducedMotion = useReducedMotion()

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      }

  if (signal.type === 'welcome') {
    return (
      <motion.section
        {...motionProps}
        aria-label="Boas-vindas"
        className="rounded-xl px-5 py-4 mb-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {t('welcome')}
        </p>
        {onCapture && (
          <button
            type="button"
            onClick={onCapture}
            aria-label={t('welcomeAriaLabel')}
            className="mt-3 text-sm font-semibold px-4 py-2.5 rounded-full"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          >
            {t('invite')}
          </button>
        )}
      </motion.section>
    )
  }

  if (signal.type === 'old-victory' && signal.entry) {
    const timeAgo = formatRelativeTime(signal.entry.created_at)
    return (
      <motion.section
        {...motionProps}
        aria-label="Vitória antiga"
        className="rounded-xl px-5 py-4 mb-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p
          className="text-xs font-medium uppercase tracking-wide mb-1"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {timeAgo}
        </p>
        <p className="text-sm font-medium leading-snug" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-fraunces, serif)' }}>
          {t('oldVictory', { time: timeAgo, evidence: signal.entry.what_i_did })}
        </p>
        {onCapture && (
          <button
            type="button"
            onClick={onCapture}
            aria-label={t('inviteAriaLabel')}
            className="mt-3 text-sm font-medium min-h-[44px] px-1"
            style={{ color: 'var(--color-primary)' }}
          >
            {t('invite')} →
          </button>
        )}
      </motion.section>
    )
  }

  if (signal.type === 'has-new' && signal.entry) {
    return (
      <motion.section
        {...motionProps}
        aria-label="Novidade recente"
        className="rounded-xl px-5 py-4 mb-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p
          className="text-sm font-medium leading-snug"
          style={{
            color: 'var(--color-primary)',
            fontFamily: 'var(--font-fraunces, serif)',
          }}
        >
          {t('hasNew', { evidence: signal.entry.what_i_did })}
        </p>

        {signal.strengthAha && strengthTheme && (
          <p
            className="mt-2 text-xs flex items-center gap-1.5"
            style={{ color: 'var(--color-coral-faisca, oklch(62% 0.22 28))' }}
          >
            <Sparkles size={12} aria-hidden="true" />
            {t('strengthAha', { theme: strengthTheme })}
          </p>
        )}

        {onCapture && (
          <button
            type="button"
            onClick={onCapture}
            aria-label={t('inviteAriaLabel')}
            className="mt-3 text-sm font-medium min-h-[44px] px-1"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {t('invite')} →
          </button>
        )}
      </motion.section>
    )
  }

  return null
}
