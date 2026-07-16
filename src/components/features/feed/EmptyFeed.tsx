'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export function EmptyFeed() {
  const t = useTranslations('feed')
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <p
        className="text-2xl font-semibold mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', lineHeight: '1.2', letterSpacing: '-0.015em' }}
      >
        {t('empty.heading')}
      </p>
      <p className="text-sm max-w-xs" style={{ color: 'var(--muted-foreground)' }}>
        {t('empty.description')}
      </p>
      <button
        type="button"
        onClick={() => router.push('/painel')}
        className="mt-6 inline-flex items-center justify-center text-sm font-medium px-5 py-2.5 rounded-full transition-opacity hover:opacity-80"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        {t('empty.cta')}
      </button>
    </div>
  )
}
