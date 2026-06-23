import { useTranslations } from 'next-intl'
import { ContactCard } from '@/components/features/support/ContactCard'

/**
 * Rodapé da landing page (feature 020) — o aperto de mão final, não um segundo CTA.
 * Fundo sóbrio (creme) que separa do gradiente saturado do `CtaSection` logo acima.
 */
export function Footer() {
  const t = useTranslations('support')

  return (
    <footer className="px-6 py-12" style={{ background: 'var(--background)' }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <ContactCard brand />
        <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
          {t('credits', { ano: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  )
}
