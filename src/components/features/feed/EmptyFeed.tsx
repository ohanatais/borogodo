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
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
      >
        {t('empty.heading')}
      </p>
      <button
        type="button"
        onClick={() => router.push('/painel')}
        className="mt-4 inline-flex items-center justify-center text-sm font-medium px-5 py-3 min-h-[48px] rounded-full transition-opacity hover:opacity-80"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        {t('empty.cta')}
      </button>
    </div>
  )
}
