'use client'

import Link from 'next/link'
import { CheckCircle2, User } from 'lucide-react'
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
  const specialties = mirror?.strengthThemes?.slice(0, 3) ?? []
  const skillSummary = mirror?.skillSummary ?? null
  const growthCount = (skillSummary?.emergentes ?? 0) + (skillSummary?.consistentes ?? 0)

  return (
    <section
      aria-label={firstName ? t('ariaLabel', { name: firstName }) : t('subtitleSelf')}
      className="rounded-xl px-6 py-5 lg:px-8 lg:py-6"
      style={{ background: 'var(--color-primary)' }}
    >
      {hasData ? (
        <>
          {/* Identity eyebrow — name steps back so the headline can lead */}
          <div className="flex items-center gap-3 mb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-10 h-10 rounded-full shrink-0 object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: 'var(--background)', color: 'var(--color-primary)' }}
                aria-hidden="true"
              >
                {firstName ? firstName[0].toUpperCase() : <User size={16} />}
              </div>
            )}
            <p
              className="text-sm font-medium min-w-0 truncate"
              style={{ color: 'var(--color-primary-fg)', opacity: 0.85 }}
            >
              {firstName
                ? <>{t('subtitle')} <em className="font-normal italic">{firstName}</em></>
                : t('subtitleSelf')}
            </p>
          </div>

          {/* Career pattern — the hero line. Display, but tight (2 lines on a wide column). */}
          {mirror?.headline && (
            <p
              className="font-display text-xl lg:text-2xl font-semibold leading-snug tracking-tight mb-3 max-w-[54ch]"
              style={{ color: 'var(--color-primary-fg)' }}
            >
              {mirror.headline}
            </p>
          )}

          {/* Themes — light caption (max 3), wraps as text, never a stack of pills */}
          {specialties.length > 0 && (
            <p
              className="text-sm leading-snug mb-4"
              style={{ color: 'var(--color-primary-fg)', opacity: 0.75 }}
            >
              {specialties.join('  ·  ')}
            </p>
          )}

          {/* Triggers row — tier counts (the growth signals) back in view, one line, + the CTA */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {skillSummary && (
              <div className="flex flex-wrap gap-1.5">
                {skillSummary.comprovadas > 0 && (
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: TIER_STYLE.Comprovada.chipBg, color: TIER_STYLE.Comprovada.chipText }}
                  >
                    <CheckCircle2 size={10} aria-hidden="true" />
                    {t('skills.comprovadas', { count: skillSummary.comprovadas })}
                  </span>
                )}
                {skillSummary.consistentes > 0 && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: TIER_STYLE.Consistente.chipBg, color: TIER_STYLE.Consistente.chipText }}
                  >
                    {t('skills.consistentes', { count: skillSummary.consistentes })}
                  </span>
                )}
                {skillSummary.emergentes > 0 && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: TIER_STYLE.Emergente.chipBg, color: TIER_STYLE.Emergente.chipText }}
                  >
                    {t('skills.emergentes', { count: skillSummary.emergentes })}
                  </span>
                )}
              </div>
            )}
            <Link
              href="/espelho"
              className="sm:ml-auto inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-primary-fg)' }}
            >
              {growthCount > 0
                ? t('viewMirrorGrowth', { count: growthCount })
                : t('viewMirror')}
            </Link>
          </div>
        </>
      ) : (
        /* Empty / forming state — keeps the welcoming big heading */
        <>
          <div className="flex items-center gap-4 mb-5">
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
                {firstName ? firstName[0].toUpperCase() : <User size={22} />}
              </div>
            )}
            <h2
              className="font-display text-2xl lg:text-[1.75rem] font-semibold leading-tight tracking-tight min-w-0"
              style={{ color: 'var(--color-primary-fg)' }}
            >
              {firstName
                ? <>{t('formingOf')} <em className="font-normal italic">{firstName}</em>{t('formingSuffix')}</>
                : t('formingSelf')}
            </h2>
          </div>
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
        </>
      )}
    </section>
  )
}
