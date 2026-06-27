import { useTranslations } from 'next-intl'

/** Manifesto brasileiro (feature 022). Server Component. */
export function ManifestoSection() {
  const t = useTranslations('manifesto')

  return (
    <section style={{ background: 'var(--background)' }} className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2
          className="mb-6 text-2xl md:text-3xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.015em' }}
        >
          {t('title')}
        </h2>
        <p className="text-lg leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          {t('body')}
        </p>
      </div>
    </section>
  )
}
