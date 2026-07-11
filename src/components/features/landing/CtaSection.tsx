import { useTranslations } from 'next-intl'
import Link from 'next/link'

/** CTA final da landing (feature 022). Server Component. CTA único pra signup (FR-009). */
export function CtaSection() {
  const t = useTranslations('cta')

  return (
    <section
      style={{ background: 'linear-gradient(145deg, oklch(32% 0.18 300) 0%, oklch(26% 0.23 325) 100%)' }}
      className="px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          className="mb-4 text-3xl md:text-4xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-fg)', lineHeight: 1.1, letterSpacing: '-0.02em' }}
        >
          {t('title')}
        </h2>
        <p className="mb-10 max-w-2xl text-lg" style={{ color: 'var(--color-primary-fg)', opacity: 0.8 }}>
          {t('subtitle')}
        </p>

        <Link
          href="/login?mode=signup"
          aria-label={t('primaryAriaLabel')}
          className="inline-flex min-h-[52px] items-center justify-center rounded-full px-8 py-3 font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
        >
          {t('primary')}
        </Link>
      </div>
    </section>
  )
}
