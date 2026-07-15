import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Clock } from 'lucide-react'
import { CURRENT_TERMS_VERSION } from '@/lib/legal/policy'
import type { LegalSection } from '@/content/legal/termos-de-uso'

interface LegalPageProps {
  namespace: 'termsPage' | 'privacyPage'
  sections: LegalSection[]
}

/**
 * Layout compartilhado das páginas legais públicas (feature 024, SC-006):
 * mesmo layout serve conteúdo placeholder e texto jurídico definitivo.
 */
export function LegalPage({ namespace, sections }: LegalPageProps) {
  const t = useTranslations(`legal.${namespace}`)

  return (
    <main className="px-6 py-16 sm:py-20" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-[68ch]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 -mx-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-black/[0.03]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {t('backToHome')}
        </Link>

        <div className="mt-8 pb-8 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1
            className="text-3xl sm:text-4xl font-semibold"
            style={{ fontFamily: 'Fraunces, serif', color: 'var(--foreground)' }}
          >
            {t('title')}
          </h1>

          <p
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Clock size={13} aria-hidden="true" />
            {t('versionLabel', { date: CURRENT_TERMS_VERSION })}
          </p>
        </div>

        <div className="flex flex-col">
          {sections.map((section, index) => (
            <section
              key={section.heading}
              className={index === 0 ? 'pt-10' : 'pt-8 mt-8 border-t'}
              style={index === 0 ? undefined : { borderColor: 'var(--border)' }}
            >
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: 'Fraunces, serif', color: 'var(--foreground)' }}
              >
                {section.heading}
              </h2>
              <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--foreground)' }}>
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
