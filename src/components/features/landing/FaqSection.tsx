import { useTranslations } from 'next-intl'
import { faqItems } from './faqData'

/**
 * Perguntas frequentes (feature 022). Server Component; renderiza `faqData.ts`, a mesma fonte
 * do `StructuredData` (FAQPage), garantindo correspondência 1:1 (SC-004). id="perguntas".
 * Usa <details>/<summary> nativos (acordeão sem JS de cliente).
 */
export function FaqSection() {
  const t = useTranslations('faq')

  return (
    <section id="perguntas" style={{ background: 'var(--background)' }} className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <h2
          className="mb-12 text-2xl md:text-3xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.015em' }}
        >
          {t('title')}
        </h2>

        <div className="flex flex-col">
          {faqItems.map((item) => (
            <details
              key={item.id}
              className="border-b py-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <summary
                className="cursor-pointer list-none text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ color: 'var(--foreground)' }}
              >
                {t(item.questionKey)}
              </summary>
              <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {t(item.answerKey)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
