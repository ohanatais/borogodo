'use client'

import { useTranslations } from 'next-intl'
import { PenLine } from 'lucide-react'
import { ProductEmptyState } from '@/components/ui/ProductEmptyState'
import { Button } from '@/components/ui/button'
import { dispatchOpenDrawer } from '@/components/features/painel/registroTriggerEvents'

export function EmptyFeed() {
  const t = useTranslations('feed')

  return (
    <ProductEmptyState
      visual={(
        <span
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-primary)' }}
        >
          <PenLine size={22} />
        </span>
      )}
      title={t('empty.heading')}
      description={t('empty.description')}
      action={<Button
        type="button"
        onClick={() => dispatchOpenDrawer()}
        size="lg"
      >
        {t('empty.cta')}
      </Button>}
    />
  )
}
