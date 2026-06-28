import { useTranslations } from 'next-intl'
import { MediaSlot } from './MediaSlot'
import { SectionLabel } from './SectionLabel'

/**
 * Pilar Provas (feature 022). O maior diferencial: ancoragem anti-fabricação. Server
 * Component; o card real entra depois pelo `MediaSlot` (FR-014). id="provas" (âncora).
 */
export function ProofSection() {
  const t = useTranslations('proof')

  return (
    <section id="provas" style={{ background: 'var(--color-cream-warm)' }} className="px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[2fr_3fr] md:gap-14">
        <div>
          <SectionLabel>{t('label')}</SectionLabel>
          <h2
            className="mb-5 text-2xl md:text-3xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', lineHeight: 1.15, letterSpacing: '-0.015em' }}
          >
            {t('title')}
          </h2>
          <p
            className="text-base leading-relaxed md:hyphens-auto md:text-justify"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {t('body')}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-full">
            <MediaSlot
              aspect="1732 / 1024"
              kind="image"
              src="/landing/espelho-categorias.png"
              label={t('mediaLabel')}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
