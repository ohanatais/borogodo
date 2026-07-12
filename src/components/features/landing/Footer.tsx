import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/Logo'
import { ContactCard } from '@/components/features/support/ContactCard'
import { LEGAL_ROUTES } from '@/lib/legal/policy'

/**
 * Rodapé da landing page (feature 020/022) — o aperto de mão final, não um segundo CTA.
 * Fundo sóbrio (creme) que separa do gradiente saturado do `CtaSection` logo acima.
 * Duas colunas: marca + tagline à esquerda, bloco de contato à direita; créditos + links legais embaixo.
 */
export function Footer() {
  const t = useTranslations('support')
  const tLegal = useTranslations('legal')

  return (
    <footer className="px-6 py-16" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 md:grid-cols-[1fr_minmax(0,26rem)] md:gap-16 md:items-start">
          {/* marca */}
          <div>
            <Logo variant="light" size="md" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              {t('brandTagline')}
            </p>
          </div>

          {/* contato */}
          <ContactCard brand className="md:p-0" />
        </div>

        <div
          className="mt-12 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {t('credits', { ano: new Date().getFullYear() })}
          </p>

          <div className="flex gap-4">
            <Link
              href={LEGAL_ROUTES.terms}
              className="text-xs underline underline-offset-2 transition-colors hover:no-underline"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {tLegal('termsLabel')}
            </Link>
            <Link
              href={LEGAL_ROUTES.privacy}
              className="text-xs underline underline-offset-2 transition-colors hover:no-underline"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {tLegal('privacyLabel')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
