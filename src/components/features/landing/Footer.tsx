import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/Logo'
import { ContactCard } from '@/components/features/support/ContactCard'

/**
 * Rodapé da landing page (feature 020/022) — o aperto de mão final, não um segundo CTA.
 * Fundo sóbrio (creme) que separa do gradiente saturado do `CtaSection` logo acima.
 * Duas colunas: marca + tagline à esquerda, bloco de contato à direita; créditos embaixo.
 */
export function Footer() {
  const t = useTranslations('support')

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

        <p
          className="mt-12 border-t pt-6 text-xs"
          style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
        >
          {t('credits', { ano: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  )
}
