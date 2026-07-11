import { useTranslations } from 'next-intl'
import { SectionLabel } from './SectionLabel'

const painPointKeys = [0, 1, 2, 3] as const

/** Dores da landing (feature 022). Server Component. As 4 dores na voz nova. */
export function PainPointsSection() {
  const t = useTranslations('painPoints')

  return (
    <section style={{ background: 'var(--color-cream-warm)' }} className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <SectionLabel>{t('label')}</SectionLabel>
        <h2
          className="mb-16 text-2xl md:text-3xl"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--foreground)',
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
          }}
        >
          {t('title')}
        </h2>

        <div className="grid gap-x-16 gap-y-10 md:grid-cols-2">
          {painPointKeys.map((i) => (
            <article key={i} className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
              <span
                className="mb-4 block text-sm font-semibold tabular-nums"
                style={{ color: 'var(--color-accent-text)', fontFamily: 'var(--font-display)' }}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3
                className="mb-3 text-lg font-semibold"
                style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
              >
                {t(`items.${i}.title`)}
              </h3>
              <p
                className="text-base leading-relaxed md:hyphens-auto md:text-justify"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {t(`items.${i}.description`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
