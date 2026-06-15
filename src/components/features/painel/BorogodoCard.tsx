'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { PanelMirror } from '@/lib/panel/getPanelData'
import { TIER_STYLE } from '@/components/features/espelho/tierStyles'

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
  const growthCount = (mirror?.skillSummary?.emergentes ?? 0) + (mirror?.skillSummary?.consistentes ?? 0)

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
            <div className="flex flex-wrap gap-2 mb-4">
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

          {/* Skill summary strip */}
          {mirror?.skillSummary && (
            <div className="mb-6 pt-2 border-t" style={{ borderColor: 'oklch(98% 0.01 320 / 0.15)' }}>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {mirror.skillSummary.comprovadas > 0 && (
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: TIER_STYLE.Comprovada.chipBg, color: TIER_STYLE.Comprovada.chipText }}
                  >
                    <CheckCircle2 size={10} aria-hidden="true" />
                    {t('skills.comprovadas', { count: mirror.skillSummary.comprovadas })}
                  </span>
                )}
                {mirror.skillSummary.consistentes > 0 && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: TIER_STYLE.Consistente.chipBg, color: TIER_STYLE.Consistente.chipText }}
                  >
                    {t('skills.consistentes', { count: mirror.skillSummary.consistentes })}
                  </span>
                )}
                {mirror.skillSummary.emergentes > 0 && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: TIER_STYLE.Emergente.chipBg, color: TIER_STYLE.Emergente.chipText }}
                  >
                    {t('skills.emergentes', { count: mirror.skillSummary.emergentes })}
                  </span>
                )}
              </div>
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
            {growthCount > 0
              ? t('viewMirrorGrowth', { count: growthCount })
              : t('viewMirror')}
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
