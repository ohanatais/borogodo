import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CheckCircle2, FileText, ExternalLink } from 'lucide-react'
import { LEGAL_ROUTES } from '@/lib/legal/policy'
import { MarketingToggle } from './MarketingToggle'

interface LegalLinksCardProps {
  marketingConsent: boolean
  termsVersion: string | null
  termsAcceptedAt: string | null
}

const LEGAL_LINK_ROW =
  'flex items-center gap-2.5 -mx-2.5 rounded-lg px-2.5 py-2.5 text-sm transition-colors hover:bg-black/[0.03]'

/** Card de "Privacidade e consentimento" em `/configuracoes` (feature 024, US1+US4). */
export function LegalLinksCard({ marketingConsent, termsVersion, termsAcceptedAt }: LegalLinksCardProps) {
  const t = useTranslations('legal')
  const tSettings = useTranslations('legal.settings')

  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          {tSettings('heading')}
        </h2>

        {termsAcceptedAt && (
          <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <CheckCircle2 size={14} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
            {tSettings('acceptedOn', {
              version: termsVersion ?? '',
              date: new Date(termsAcceptedAt).toLocaleDateString('pt-BR'),
            })}
          </p>
        )}
      </div>

      <div className="flex flex-col">
        <Link
          href={LEGAL_ROUTES.terms}
          target="_blank"
          rel="noopener noreferrer"
          className={LEGAL_LINK_ROW}
          style={{ color: 'var(--foreground)' }}
        >
          <FileText size={16} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <span className="flex-1">{t('termsLabel')}</span>
          <ExternalLink size={14} style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
        </Link>
        <Link
          href={LEGAL_ROUTES.privacy}
          target="_blank"
          rel="noopener noreferrer"
          className={LEGAL_LINK_ROW}
          style={{ color: 'var(--foreground)' }}
        >
          <FileText size={16} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <span className="flex-1">{t('privacyLabel')}</span>
          <ExternalLink size={14} style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
        </Link>
      </div>

      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <MarketingToggle initialValue={marketingConsent} />
      </div>
    </div>
  )
}
