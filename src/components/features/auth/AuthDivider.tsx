import { useTranslations } from 'next-intl'

export function AuthDivider() {
  const t = useTranslations('auth')

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {t('divider')}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}
