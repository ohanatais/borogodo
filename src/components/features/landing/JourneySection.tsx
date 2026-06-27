import { useTranslations } from 'next-intl'

const stepKeys = [0, 1, 2, 3] as const

/**
 * Os 4 verbos como jornada (feature 022): Descobrir, Entender, Provar, Usar. Server Component.
 * Substitui o antigo "como funciona" de 3 passos genéricos. Sem promessa fora do v1 (FR-007).
 */
export function JourneySection() {
  const t = useTranslations('journey')

  return (
    <section id="como-funciona" style={{ background: 'var(--color-warm-bg, oklch(97% 0.02 85))' }} className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
        <h2
          className="mb-14 text-2xl md:text-3xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.015em' }}
        >
          {t('title')}
        </h2>

        <ol className="flex flex-col gap-10">
          {stepKeys.map((i) => (
            <li key={i} className="flex flex-col gap-2 md:flex-row md:gap-8">
              <div className="md:w-40 md:shrink-0">
                <span
                  className="text-xl font-bold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
                >
                  {t(`steps.${i}.verb`)}
                </span>
              </div>
              <div className="flex-1">
                <p
                  className="mb-1 text-lg"
                  style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--foreground)' }}
                >
                  {t(`steps.${i}.quote`)}
                </p>
                <p className="text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  {t(`steps.${i}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
