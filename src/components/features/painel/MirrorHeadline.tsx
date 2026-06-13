import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { STATUS_CONFIG, type MirrorStatus } from '@/lib/panel/getMirrorStatus'
import { GenerateMirrorButton } from './GenerateMirrorButton'

const MIRROR_READY_THRESHOLD = 3

interface MirrorHeadlineProps {
  headline: string | null
  status: MirrorStatus
  entryCount: number
}

export function MirrorHeadline({ headline, status, entryCount }: MirrorHeadlineProps) {
  const t = useTranslations('panel')
  const { dot } = STATUS_CONFIG[status]
  const mirrorReady = !headline && entryCount >= MIRROR_READY_THRESHOLD

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
      ) : mirrorReady ? (
        <div className="space-y-3">
          <p className="text-xl sm:text-2xl font-medium" style={{ color: 'var(--foreground)' }}>
            {t('mirror.ready')}
          </p>
          <GenerateMirrorButton />
        </div>
      ) : (
        <p className="text-xl sm:text-2xl font-medium" style={{ color: 'var(--muted-foreground)' }}>
          {t('mirror.fallback')}
        </p>
      )}
    </section>
  )
}
