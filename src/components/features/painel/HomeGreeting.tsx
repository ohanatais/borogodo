'use client'

import { useTranslations } from 'next-intl'

interface HomeGreetingProps {
  name: string
}

type GreetingPeriod = 'morning' | 'afternoon' | 'evening'

function getGreetingPeriod(hour: number): GreetingPeriod {
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

/** Saudação personalizada do Painel (US5, FR-011) — Bom dia/Boa tarde/Boa noite + nome. */
export function HomeGreeting({ name }: HomeGreetingProps) {
  const t = useTranslations('painel')
  const firstName = name.trim().split(' ')[0] || name
  const period = getGreetingPeriod(new Date().getHours())

  return (
    <div className="mb-6">
      <h1
        className="font-display text-2xl lg:text-[1.75rem] font-semibold leading-tight tracking-tight"
        style={{ color: 'var(--foreground)' }}
      >
        {t(`greetingByTime.${period}`, { name: firstName })}
      </h1>
      <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
        {t('greetingSubtitle')}
      </p>
    </div>
  )
}
