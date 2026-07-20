'use client'

import { PenLine } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { dispatchOpenDrawer } from './registroTriggerEvents'

/**
 * CTA principal do Painel. A captura acontece no Drawer; o Painel não simula um campo de texto que
 * deixa de existir assim que recebe foco.
 */
export function RegistroTrigger() {
  const t = useTranslations('painel.registroTrigger')

  return (
    <Button
      type="button"
      size="lg"
      onClick={() => dispatchOpenDrawer({})}
      onPaste={(event) => {
        const text = event.clipboardData?.getData('text')?.trim()
        if (text) {
          event.preventDefault()
          dispatchOpenDrawer({ initialText: text })
        }
      }}
      className="shrink-0 rounded-full"
      aria-label={t('ariaLabel')}
    >
      <PenLine size={18} aria-hidden="true" />
      {t('label')}
    </Button>
  )
}
