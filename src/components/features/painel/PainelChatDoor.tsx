'use client'

import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { openChatSheet } from '@/components/features/chat/ChatSheet'

/**
 * Porta de conversa do Painel (021): faixa aditiva no topo da Home que abre o chat em
 * modo pergunta. Reusa o chat existente (`openChatSheet`) — não duplica a barra global,
 * que segue intacta em todas as páginas. O chat é ferramenta onipresente, nunca a Home.
 */
export function PainelChatDoor() {
  const t = useTranslations('painel.chatDoor')

  return (
    <button
      type="button"
      onClick={() => openChatSheet()}
      aria-label={t('ariaLabel')}
      className="flex items-center gap-3 w-full min-h-12 rounded-full px-5 py-3 text-left transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        outlineColor: 'var(--color-primary)',
      }}
    >
      <MessageCircle size={20} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {t('placeholder')}
      </span>
    </button>
  )
}
