import { useTranslations } from 'next-intl'
import { MediaSlot } from './MediaSlot'

/**
 * Pilar Provas (feature 022). O maior diferencial: ancoragem anti-fabricação. Server
 * Component; o card real entra depois pelo `MediaSlot` (FR-014). id="provas" (âncora).
 */
export function ProofSection() {
  const t = useTranslations('proof')

  return (
    <section id="provas" style={{ background: 'var(--background)' }} className="px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <h2
            className="mb-5 text-2xl md:text-3xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', lineHeight: 1.15, letterSpacing: '-0.015em' }}
          >
            {t('title')}
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {t('body')}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            <MediaSlot aspect="4/3" kind="placeholder" label={t('mediaLabel')} note={t('mediaNote')}>
              <div className="flex h-full items-center justify-center p-6 text-center">
                <span className="text-sm" style={{ color: 'oklch(72% 0.05 320)' }}>
                  {t('mediaLabel')}
                </span>
              </div>
            </MediaSlot>
          </div>
        </div>
      </div>
    </section>
  )
}
