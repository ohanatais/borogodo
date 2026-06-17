'use client'

import { useTranslations } from 'next-intl'
import { BookmarkPlus, X } from 'lucide-react'

export interface CaptureOfferProps {
  onAccept: () => void
  onDismiss: () => void
}

/**
 * Banner discreto (018 US2). Quando a opinião foi gerada a partir de uma vivência dita na hora,
 * convida a salvá-la como entrada permanente. Linha única acima da borda do rodapé do GenerateSheet.
 */
export function CaptureOffer({ onAccept, onDismiss }: CaptureOfferProps) {
  const t = useTranslations('presenca')

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg"
      style={{ background: 'var(--muted)' }}
    >
      <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
        <BookmarkPlus size={14} aria-hidden="true" />
        {t('captureOffer.question')}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex items-center justify-center text-sm px-3 py-1.5 min-h-[48px] rounded-lg transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('captureOffer.save')}
        </button>
        <button
          type="button"
          aria-label={t('captureOffer.dismiss')}
          onClick={onDismiss}
          className="inline-flex items-center justify-center w-8 h-8 min-w-[48px] min-h-[48px] rounded-full transition-opacity hover:opacity-70"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
