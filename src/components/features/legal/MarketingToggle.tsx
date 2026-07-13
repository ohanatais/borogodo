'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { setMarketingConsent } from '@/lib/actions/consent'
import { Checkbox } from '@/components/ui/Checkbox'

interface MarketingToggleProps {
  initialValue: boolean
}

/** Toggle de marketing em `/configuracoes` (feature 024, US4) — otimista, com rollback em erro. */
export function MarketingToggle({ initialValue }: MarketingToggleProps) {
  const t = useTranslations('legal.marketingOptIn')
  const [checked, setChecked] = useState(initialValue)

  async function handleToggle(next: boolean) {
    setChecked(next)

    const result = await setMarketingConsent(next)

    if (!result.success) {
      setChecked(!next)
    }
  }

  return (
    <label className="flex items-start gap-3 min-h-12 py-1 cursor-pointer">
      <span className="mt-0.5">
        <Checkbox checked={checked} onChange={handleToggle} ariaLabel={t('label')} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {t('label')}
        </span>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {t('helper')}
        </span>
      </span>
    </label>
  )
}
