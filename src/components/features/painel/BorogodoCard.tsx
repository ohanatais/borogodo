'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { PanelMirror } from '@/lib/panel/getPanelData'

interface BorogodoCardProps {
  name: string
  avatarUrl?: string | null
  mirror: PanelMirror | null
  entryCount: number
}

export function BorogodoCard({ name, avatarUrl, mirror, entryCount }: BorogodoCardProps) {
  const t = useTranslations('panel.borogodoCard')
  const firstName = name.trim().split(' ')[0] || name

  const hasData = mirror !== null
  const specialties = mirror?.strengthThemes?.slice(0, 5) ?? []

  return (
    <section
      aria-label={t('ariaLabel', { name: firstName })}
      className="rounded-xl p-6 lg:p-8 mb-6"
      style={{ background: 'var(--color-primary)' }}
    >
      {/* Avatar + heading */}
      <div className="flex items-center gap-4 mb-6">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-14 h-14 rounded-full shrink-0 object-cover"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: 'var(--background)', color: 'var(--color-primary)' }}
            aria-hidden="true"
          >
            {firstName[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div className="min-w-0">
          {hasData ? (
            <h2
              className="font-display text-2xl lg:text-[1.75rem] font-semibold leading-tight tracking-tight"
              style={{ color: 'var(--color-primary-fg)' }}
            >
              {t('subtitle')} <em className="font-normal italic">{firstName}</em>
            </h2>
          ) : (
            <h2
              className="font-display text-2xl lg:text-[1.75rem] font-semibold leading-tight tracking-tight"
              style={{ color: 'var(--color-primary-fg)' }}
            >
              {t('formingOf')} <em className="font-normal italic">{firstName}</em>{t('formingSuffix')}
            </h2>
          )}
        </div>
      </div>

      {hasData ? (
        <>
          {/* Specialty chips */}
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {specialties.map((theme) => (
                <span
                  key={theme}
                  className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
                  style={{
                    background: 'oklch(98% 0.01 320 / 0.15)',
                    color: 'var(--color-primary-fg)',
                  }}
                >
                  {theme}
                </span>
              ))}
            </div>
          )}

          {/* Career pattern — display font, hero size */}
          {mirror?.headline && (
            <p
              className="font-display text-lg lg:text-xl leading-snug mb-6 max-w-[44ch]"
              style={{ color: 'var(--color-primary-fg)', opacity: 0.95 }}
            >
              {mirror.headline}
            </p>
          )}

          <Link
            href="/espelho"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-primary-fg)' }}
          >
            {t('viewMirror')}
          </Link>
        </>
      ) : (
        /* Empty / forming state */
        <div>
          <p
            className="text-sm opacity-70"
            style={{ color: 'var(--color-primary-fg)' }}
          >
            {t('formingSubtitle')}
          </p>
          <button
            type="button"
            onClick={() => document.querySelector('textarea')?.focus()}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium opacity-80 hover:opacity-100"
            style={{ color: 'var(--color-primary-fg)' }}
          >
            Contar uma história agora ↓
          </button>
        </div>
      )}
    </section>
  )
}
