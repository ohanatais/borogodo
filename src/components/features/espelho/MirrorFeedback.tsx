'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { submitMirrorFeedback } from '@/app/[locale]/(app)/espelho/actions'

interface MirrorFeedbackProps {
  snapshotId: string
  initialResonated: boolean | null
}

export function MirrorFeedback({ snapshotId, initialResonated }: MirrorFeedbackProps) {
  const t = useTranslations('espelho')
  const [resonated, setResonated] = useState<boolean | null>(initialResonated)

  const handleFeedback = async (value: boolean) => {
    await submitMirrorFeedback(snapshotId, value)
    setResonated(value)
  }

  if (resonated !== null) {
    return (
      <p className="text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
        {t('feedback.confirmed')}
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
        {t('feedback.question')}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleFeedback(true)}
          className="px-5 py-2 rounded-full text-sm font-semibold"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          {t('feedback.yes')}
        </button>
        <button
          type="button"
          onClick={() => handleFeedback(false)}
          className="px-5 py-2 rounded-full text-sm font-semibold border"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          {t('feedback.no')}
        </button>
      </div>
    </div>
  )
}
