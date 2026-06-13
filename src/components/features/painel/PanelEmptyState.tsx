import { useTranslations } from 'next-intl'

export function PanelEmptyState() {
  const t = useTranslations('panel')

  return (
    <section className="px-6 py-12 flex flex-col items-center text-center gap-3">
      <p className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
        {t('empty.title')}
      </p>
      <p className="text-sm max-w-xs" style={{ color: 'var(--muted-foreground)' }}>
        {t('empty.subtitle')}
      </p>
    </section>
  )
}
