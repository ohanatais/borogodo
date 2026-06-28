import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { FadeIn } from '@/components/ui/FadeIn'
import { MediaSlot } from './MediaSlot'

/**
 * Hero da landing (feature 022). Server Component: o conteúdo (eyebrow, h1, subheadline
 * definitória, CTA único) vai no HTML servido (SSR/GEO). Layout: copy em cima, vídeo real
 * do espelho grande logo abaixo (mídia em propósito nativo, sem corte). A subheadline
 * compartilha a largura da headline (terminam juntas).
 */
export function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section
      className="relative overflow-hidden px-6 pt-24 pb-16 md:pt-32 md:pb-20"
      style={{
        background: 'linear-gradient(145deg, oklch(26% 0.23 325) 0%, oklch(32% 0.18 300) 100%)',
      }}
    >
      <div className="relative mx-auto max-w-5xl">
        {/* copy — centralizada, na mesma largura do vídeo largo abaixo */}
        <FadeIn className="text-center">
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
                fontSize: 'clamp(1.6rem, 4.2vw, 2.6rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              } as React.CSSProperties
            }
          >
            <strong style={{ fontWeight: 700, display: 'block' }}>{t('headline')}</strong>
            <em style={{ fontWeight: 400, fontStyle: 'italic', display: 'block', opacity: 0.85 }}>
              {t('headlineEmphasis')}
            </em>
          </h1>

          <p className="mb-8 text-lg leading-relaxed" style={{ color: 'var(--color-primary-fg)', opacity: 0.8 }}>
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
        </FadeIn>

        {/* vídeo real do espelho — propósito nativo, sem corte */}
        <FadeIn delay={0.2} className="mt-12 md:mt-16">
          <MediaSlot
            aspect="2840 / 1328"
            kind="video"
            label={t('videoAlt')}
            src="/landing/espelho.mp4"
            poster="/landing/espelho.jpg"
          />
        </FadeIn>
      </div>
    </section>
  )
}
