import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { PanelMirror } from '@/lib/panel/getPanelData'

interface BorogodoCardProps {
  name: string
  mirror: PanelMirror | null
  entryCount: number
}

const MIRROR_READY_THRESHOLD = 3

export function BorogodoCard({ name, mirror, entryCount }: BorogodoCardProps) {
  const t = useTranslations('panel.borogodoCard')
  const firstName = name.trim().split(' ')[0] || name
  const initial = firstName[0]?.toUpperCase() ?? '?'

  const hasData = mirror !== null && entryCount >= MIRROR_READY_THRESHOLD
  const specialties = mirror?.strengthThemes?.slice(0, 4) ?? []
  const skillPills = mirror?.strengthThemes?.slice(0, 3) ?? []

  return (
    <section
      className="rounded-xl p-6 mb-4"
      style={{ background: 'var(--color-primary)' }}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
          style={{ background: 'white', color: 'var(--color-primary)' }}
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p
            className="text-xs font-medium opacity-70 mb-0.5"
            style={{ color: 'var(--color-primary-fg)' }}
          >
            {t('subtitle')}
          </p>
          <p
            className="text-base font-semibold truncate"
            style={{ color: 'var(--color-primary-fg)' }}
          >
            {firstName}
          </p>
        </div>
      </div>

      {hasData ? (
        <>
          {/* Specialties chips */}
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {specialties.map((theme) => (
                <span
                  key={theme}
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: 'oklch(98% 0.01 320 / 0.15)',
                    color: 'var(--color-primary-fg)',
                    border: '1px solid oklch(98% 0.01 320 / 0.3)',
                  }}
                >
                  {theme}
                </span>
              ))}
            </div>
          )}

          {/* Skills destaque pills */}
          {skillPills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {skillPills.map((skill) => (
                <span
                  key={`skill-${skill}`}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: 'transparent',
                    color: 'var(--color-primary-fg)',
                    border: '1px solid oklch(98% 0.01 320 / 0.6)',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Career pattern line */}
          {mirror?.headline && (
            <p
              className="text-sm mb-4 leading-relaxed opacity-80"
              style={{ color: 'var(--color-primary-fg)' }}
            >
              {mirror.headline}
            </p>
          )}

          {/* Link to full mirror */}
          <Link
            href="/espelho"
            className="inline-block text-sm font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-primary-fg)' }}
          >
            {t('viewMirror')}
          </Link>
        </>
      ) : (
        /* Empty state */
        <div>
          <p
            className="text-base font-medium mb-1"
            style={{ color: 'var(--color-primary-fg)' }}
          >
            {t('forming')}
          </p>
          <p
            className="text-sm opacity-70"
            style={{ color: 'var(--color-primary-fg)' }}
          >
            {t('formingSubtitle')}
          </p>
        </div>
      )}
    </section>
  )
}
