import { useTranslations } from 'next-intl'
import Link from 'next/link'

export function CtaSection() {
  const t = useTranslations('cta')

  return (
    <section
      style={{ background: 'linear-gradient(145deg, oklch(32% 0.18 300) 0%, oklch(26% 0.23 325) 100%)' }}
      className="px-6 py-20 md:py-28"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2
          className="text-3xl md:text-4xl mb-4"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-primary-fg)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          <strong style={{ fontWeight: 700, display: 'block' }}>Seu borogodó</strong>
          <em style={{ fontWeight: 400, fontStyle: 'italic' }}>está esperando ser nomeado.</em>
        </h2>
        <p
          className="text-lg mb-10"
          style={{ color: 'var(--color-primary-fg)', opacity: 0.8 }}
        >
          {t('subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login?mode=signup"
            aria-label={t('primaryAriaLabel')}
            className="inline-flex items-center justify-center min-h-[52px] px-8 py-3 rounded-full font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-accent-fg)',
            }}
          >
            {t('primary')}
          </Link>

          <Link
            href="/login"
            aria-label={t('secondaryAriaLabel')}
            className="inline-flex items-center justify-center min-h-[52px] px-8 py-3 rounded-full font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: 'var(--color-primary-fg)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            {t('secondary')}
          </Link>
        </div>
      </div>
    </section>
  )
}
