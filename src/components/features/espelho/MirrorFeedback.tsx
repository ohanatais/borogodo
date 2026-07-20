'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { submitMirrorFeedback } from '@/app/[locale]/(app)/espelho/actions'
import { Button } from '@/components/ui/button'

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
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Sua resposta ajuda o Borogodó a afinar a próxima leitura.
      </p>
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => handleFeedback(true)}
          className="rounded-full px-5"
        >
          {t('feedback.yes')}
        </Button>
        <Button
          type="button"
          onClick={() => handleFeedback(false)}
          variant="outline"
          className="rounded-full px-5"
        >
          {t('feedback.no')}
        </Button>
      </div>
    </div>
  )
}
