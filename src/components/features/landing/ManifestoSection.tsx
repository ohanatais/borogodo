import { useTranslations } from 'next-intl'
import { SectionLabel } from './SectionLabel'

/** Manifesto brasileiro (feature 022). Server Component. */
export function ManifestoSection() {
  const t = useTranslations('manifesto')

  return (
    <section style={{ background: 'var(--color-deep-bg)' }} className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <SectionLabel tone="dark">{t('label')}</SectionLabel>
        <h2
          className="mb-6 text-2xl md:text-3xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-fg)', lineHeight: 1.2, letterSpacing: '-0.015em' }}
        >
          {t('title')}
        </h2>
        <p
          className="text-lg leading-relaxed md:hyphens-auto md:text-justify"
          style={{ color: 'var(--color-primary-fg)', opacity: 0.82 }}
        >
          {t('body')}
        </p>
      </div>
    </section>
  )
}
