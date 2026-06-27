import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { HeroDemo } from './HeroDemo'

/**
 * Hero da landing (feature 022). Server Component: o conteúdo (eyebrow, h1 da dor,
 * subheadline definitória, CTA único) vai no HTML servido (SSR/GEO). A demo é uma ilha
 * client (`HeroDemo`), visível também no mobile.
 */
export function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section
      className="relative overflow-hidden px-6 pt-32 pb-20 md:pt-44 md:pb-28"
      style={{
        background: 'linear-gradient(145deg, oklch(26% 0.23 325) 0%, oklch(32% 0.18 300) 100%)',
      }}
    >
      <div className="relative mx-auto max-w-5xl">
        <div className="grid items-center gap-12 md:grid-cols-[54%_46%] md:gap-14">
          {/* copy */}
          <div>
            <p
              className="mb-5 text-sm"
              style={{ color: 'var(--color-primary-fg)', opacity: 0.7, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
            >
              {t('eyebrow')}
            </p>

            <h1
              className="mb-6"
              style={
                {
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-primary-fg)',
                  fontSize: 'clamp(2rem, 3.4vw, 3.25rem)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                  textWrap: 'balance',
                } as React.CSSProperties
              }
            >
              <strong style={{ fontWeight: 700, display: 'block' }}>{t('headline')}</strong>
              <em style={{ fontWeight: 400, fontStyle: 'italic', display: 'block', opacity: 0.85 }}>
                {t('headlineEmphasis')}
              </em>
            </h1>

            <p className="mb-8 max-w-md text-lg leading-relaxed" style={{ color: 'var(--color-primary-fg)', opacity: 0.8 }}>
              {t('subheadline')}
            </p>

            <Link
              href="/login?mode=signup"
              aria-label={t('ctaAriaLabel')}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full px-8 py-3 font-semibold transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
            >
              {t('cta')}
            </Link>

            <p className="mt-4 text-sm" style={{ color: 'var(--color-primary-fg)', opacity: 0.85 }}>
              {t('microcopy')}
            </p>
            <p className="mt-2 text-xs" style={{ color: 'var(--color-primary-fg)', opacity: 0.6 }}>
              {t('microTrust')}
            </p>
          </div>

          {/* demo — visível no mobile também */}
          <div className="flex justify-center">
            <HeroDemo />
          </div>
        </div>
      </div>
    </section>
  )
}
