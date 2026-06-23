import { useTranslations } from 'next-intl'
import { ExternalLink } from 'lucide-react'
import { CopyButton } from '@/components/ui/CopyButton'
import { SUPPORT_EMAIL, LINKEDIN_URL } from '@/lib/support/channels'

interface ContactCardProps {
  /** `true` no rodapé da LP (registro de marca); padrão é o tratamento de card do app. */
  brand?: boolean
  className?: string
}

/**
 * Bloco de contato reutilizável (feature 020): e-mail copiável (herói) + LinkedIn secundário
 * + microcopy de SLA. Server Component síncrono (usa `useTranslations`, não a versão async)
 * para renderizar tanto no rodapé da LP quanto na Central de Configurações sem divergir.
 */
export function ContactCard({ brand = false, className = '' }: ContactCardProps) {
  const t = useTranslations('support')
  // Server Component (sem hooks): id estável e único por superfície, para o caso de o rodapé
  // (brand) e o card do app coexistirem na mesma árvore sem colidir o `aria-labelledby`.
  const headingId = `contact-card-heading-${brand ? 'brand' : 'app'}`
  const hasLinkedin = LINKEDIN_URL.length > 0

  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-xl p-6 flex flex-col gap-4 ${className}`}
      style={
        brand
          ? { color: 'var(--foreground)' }
          : { background: 'var(--card)', border: '1px solid var(--border)' }
      }
    >
      <h2
        id={headingId}
        className="text-base font-semibold"
        style={{ fontFamily: 'var(--font-display), serif', color: 'var(--foreground)' }}
      >
        {t('heading')}
      </h2>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            {t('emailLabel')}
          </span>
          <span className="text-base font-medium select-all" style={{ color: 'var(--foreground)' }}>
            {SUPPORT_EMAIL}
          </span>
        </div>

        <CopyButton
          value={SUPPORT_EMAIL}
          copyLabel={t('copyButton')}
          copiedLabel={t('copied')}
          failedLabel={t('copyFailed')}
        />
      </div>

      {hasLinkedin && (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t('linkedinLabel')}{' '}
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 rounded-sm"
            style={{ color: 'var(--color-accent-text)' }}
          >
            {t('linkedinCta')}
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </p>
      )}

      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {t('sla')}
      </p>
    </section>
  )
}
