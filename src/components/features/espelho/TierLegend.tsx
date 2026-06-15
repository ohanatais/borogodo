'use client'

import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function TierLegend() {
  const t = useTranslations('espelho.categories.legend')

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-5">
      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ background: 'var(--color-lilas-nevoa-text)', opacity: 0.6 }}
          aria-hidden="true"
        />
        <strong className="font-medium">Emergente</strong>
        <span className="opacity-70">— {t('emergente')}</span>
      </span>

      <span className="text-xs opacity-30" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true">→</span>

      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ background: 'var(--color-warm-text)', opacity: 0.7 }}
          aria-hidden="true"
        />
        <strong className="font-medium">Consistente</strong>
        <span className="opacity-70">— {t('consistente')}</span>
      </span>

      <span className="text-xs opacity-30" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true">→</span>

      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        <CheckCircle2
          size={10}
          aria-hidden="true"
          className="shrink-0"
          style={{ color: 'var(--color-primary)', opacity: 0.85 }}
        />
        <strong className="font-medium" style={{ color: 'var(--color-primary)' }}>Comprovada</strong>
        <span className="opacity-70">— {t('comprovada')}</span>
      </span>
    </div>
  )
}
