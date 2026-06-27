import { useTranslations } from 'next-intl'

const painPointKeys = [0, 1, 2, 3] as const

/** Dores da landing (feature 022). Server Component. As 4 dores na voz nova. */
export function PainPointsSection() {
  const t = useTranslations('painPoints')

  return (
    <section style={{ background: 'var(--background)' }} className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
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

        <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
          {painPointKeys.map((i) => (
            <article key={i}>
              <span
                className="mb-4 block h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--color-accent)' }}
                aria-hidden="true"
              />
              <h3
                className="mb-3 text-lg font-semibold"
                style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
              >
                {t(`items.${i}.title`)}
              </h3>
              <p className="text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {t(`items.${i}.description`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
