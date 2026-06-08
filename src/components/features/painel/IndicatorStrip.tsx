import { useTranslations } from 'next-intl'

interface IndicatorStripProps {
  entryCount: number
  monthsSpan: number | null
  strengthCount: number
  daysSince: number
}

const RECENT_DAYS_LIMIT = 6

function timeSinceKey(daysSince: number): 'today' | 'oneDay' | 'days' | 'week' {
  if (daysSince === 0) return 'today'
  if (daysSince === 1) return 'oneDay'
  if (daysSince <= RECENT_DAYS_LIMIT) return 'days'
  return 'week'
}

export function IndicatorStrip({ entryCount, monthsSpan, strengthCount, daysSince }: IndicatorStripProps) {
  const t = useTranslations('panel')
  const key = timeSinceKey(daysSince)

  const items: string[] = [
    `${entryCount} ${t('indicators.entries', { count: entryCount })}`,
  ]

  if (monthsSpan !== null) {
    items.push(`${monthsSpan} ${t('indicators.months', { count: monthsSpan })}`)
  }

  if (strengthCount > 0) {
    items.push(`${strengthCount} ${t('indicators.strengths', { count: strengthCount })}`)
  }

  items.push(t(`indicators.timeSince.${key}`, { count: daysSince }))

  return (
    <div
      className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 px-6 py-3 text-sm border-y"
      style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
    >
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">·</span>}
          {item}
        </span>
      ))}
    </div>
  )
}
