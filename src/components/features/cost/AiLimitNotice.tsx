'use client'

import { useTranslations } from 'next-intl'
import { Clock } from 'lucide-react'
import type { AiLimitInfo } from '@/lib/ai/cost/clientLimit'

interface AiLimitNoticeProps {
  info: AiLimitInfo
  onDismiss?: () => void
}

/**
 * Mensagem honesta de limite (023). Pausa calorosa, NUNCA alarme: usa lilás-névoa (calmo,
 * on-brand), não o vermelho-alerta reservado a falhas reais. Sinaliza "respira", não "quebrou".
 * `role="status"` (polite) porque não é erro. Sem botão de retry — só liberar com o tempo.
 */
export function AiLimitNotice({ info, onDismiss }: AiLimitNoticeProps) {
  const t = useTranslations('aiLimit')
  const message = info.kind === 'rateLimited' ? t('rateLimited', { minutes: info.minutes }) : t('overloaded')

  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-xl px-5 py-6 text-center"
      style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-lilas-nevoa-text)' }}
    >
      <Clock size={20} aria-hidden="true" style={{ opacity: 0.8 }} />
      <p className="text-sm leading-relaxed text-balance">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-[44px] rounded-lg px-4 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-lilas-nevoa-text)' }}
        >
          {t('dismiss')}
        </button>
      ) : null}
    </div>
  )
}
