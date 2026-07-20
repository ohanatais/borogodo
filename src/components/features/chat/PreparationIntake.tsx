'use client'

import { useTranslations } from 'next-intl'
import type { PrepMoment } from '@/lib/content/intentions'

export function PreparationIntake({ moment }: { moment: PrepMoment }) {
  const t = useTranslations('preparation.intake')

  return (
    <div className="flex w-full flex-col justify-start">
      <div className="w-full">
        <div className="w-full rounded-2xl rounded-bl-md border bg-white px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{t(`eyebrow.${moment}`)}</p>
          <p className="mt-1 text-base font-semibold leading-snug">{t(`question.${moment}`)}</p>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{t(`hint.${moment}`)}</p>
        </div>
      </div>
    </div>
  )
}
