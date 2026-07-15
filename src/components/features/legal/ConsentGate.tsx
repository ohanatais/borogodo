'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ShieldCheck } from 'lucide-react'
import { recordTermsAcceptance } from '@/lib/actions/consent'
import { LEGAL_ROUTES } from '@/lib/legal/policy'

interface ConsentGateProps {
  /** `true` quando a conta já aceitou uma versão anterior (bump); `false` quando nunca aceitou. */
  hasAcceptedBefore: boolean
}

/**
 * Tela de re-consentimento (feature 024, US3) — fora do `AppShell`, foco único: aceitar a
 * versão vigente dos termos em 1 clique e seguir para `/painel`.
 */
export function ConsentGate({ hasAcceptedBefore }: ConsentGateProps) {
  const t = useTranslations('legal.consentGate')
  const tLegal = useTranslations('legal')
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    setError(false)

    const result = await recordTermsAcceptance()

    setSubmitting(false)
    if (!result.success) {
      setError(true)
      return
    }
    router.push('/painel')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-creme)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8 flex flex-col items-center gap-5 text-center"
        style={{ background: 'var(--background)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      >
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'var(--color-lilas-nevoa)' }}
        >
          <ShieldCheck size={22} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
        </span>

        <div className="flex flex-col gap-2">
          <h1
            className="text-2xl leading-tight font-semibold"
            style={{ fontFamily: 'Fraunces, serif', color: 'var(--foreground)' }}
          >
            {hasAcceptedBefore ? t('titleBump') : t('titleStale')}
          </h1>

          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {t('body')}
          </p>
        </div>

        <div className="flex justify-center gap-4 text-sm">
          <Link
            href={LEGAL_ROUTES.terms}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
            style={{ color: 'var(--color-primary)' }}
          >
            {tLegal('termsLabel')}
          </Link>
          <Link
            href={LEGAL_ROUTES.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
            style={{ color: 'var(--color-primary)' }}
          >
            {tLegal('privacyLabel')}
          </Link>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="min-h-12 w-full rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          {submitting ? (
            <span
              className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          ) : (
            t('submit')
          )}
        </button>

        {error && (
          <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
            {t('error')}
          </p>
        )}
      </div>
    </main>
  )
}
