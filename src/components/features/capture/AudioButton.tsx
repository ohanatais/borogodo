'use client'

import { Mic } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function AudioButton() {
  const t = useTranslations('capture')

  return (
    <button
      type="button"
      disabled
      aria-label={t('composer.audioAriaLabel')}
      title={t('composer.audioComingSoon')}
      className="p-2 rounded-full min-w-[48px] min-h-[48px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ color: 'var(--muted-foreground)' }}
    >
      <Mic size={20} />
    </button>
  )
}
