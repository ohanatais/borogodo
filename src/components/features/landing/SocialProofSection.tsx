import { useTranslations } from 'next-intl'
import { LINKEDIN_URL } from '@/lib/support/channels'
import { SectionLabel } from './SectionLabel'

/**
 * Prova social honesta (feature 022): build-in-public pela founder, sem depoimento inventado
 * nem número de fachada (FR-005). Server Component.
 */
export function SocialProofSection() {
  const t = useTranslations('socialProof')

  return (
    <section style={{ background: 'var(--color-warm-bg, oklch(97% 0.02 85))' }} className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <SectionLabel>{t('label')}</SectionLabel>
        <h2
          className="mb-5 text-2xl md:text-3xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.015em' }}
        >
          {t('title')}
        </h2>
        <p className="mb-8 text-lg leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          {t('body')}
        </p>

        {LINKEDIN_URL.length > 0 && (
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('linkAriaLabel')}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full px-6 py-2 font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
          >
            {t('link')}
          </a>
        )}
      </div>
    </section>
  )
}
