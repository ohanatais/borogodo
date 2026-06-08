import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { STATUS_CONFIG, type MirrorStatus } from '@/lib/panel/getMirrorStatus'

interface MirrorHeadlineProps {
  headline: string | null
  status: MirrorStatus
}

export function MirrorHeadline({ headline, status }: MirrorHeadlineProps) {
  const t = useTranslations('panel')
  const { dot, label } = STATUS_CONFIG[status]

  return (
    <section className="space-y-3 px-6 py-8 text-center sm:text-left">
      <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} aria-hidden="true" />
        {t(`status.${status}`)}
      </span>

      {headline ? (
        <div className="space-y-2">
          <p className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
            {headline}
          </p>
          <Link
            href="/espelho"
            className="inline-block text-sm font-semibold"
            style={{ color: 'var(--color-primary)' }}
          >
            {t('mirror.link')} →
          </Link>
        </div>
      ) : (
        <p className="text-xl sm:text-2xl font-medium" style={{ color: 'var(--muted-foreground)' }}>
          {t('mirror.fallback')}
        </p>
      )}

      <p className="sr-only">{label}</p>
    </section>
  )
}
