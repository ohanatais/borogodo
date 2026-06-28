'use client'

import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { openChatSheet } from '@/components/features/chat/ChatSheet'

/**
 * Porta de conversa do Painel (021): faixa no topo da Home que abre o chat em modo pergunta.
 * Existe pra DESCOBERTA — o chat por dentro já guia bem (starters + placeholder), mas o toggle
 * "Perguntar" da barra global é discreto e a pessoa pode nunca achar. A copy aqui ensina com um
 * exemplo concreto ("o que me destaca?"), deixando claro que dá pra perguntar qualquer coisa.
 * Reusa o chat existente (`openChatSheet`) — não duplica o motor, só o ponto de entrada.
 */
export function PainelChatDoor() {
  const t = useTranslations('painel.chatDoor')

  return (
    <button
      type="button"
      onClick={() => openChatSheet()}
      aria-label={t('ariaLabel')}
      className="flex items-center gap-3 w-full min-h-12 rounded-full px-5 py-3.5 text-left transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        outlineColor: 'var(--color-primary)',
      }}
    >
      <MessageCircle size={20} className="shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
      <span className="text-sm leading-snug" style={{ color: 'var(--muted-foreground)' }}>
        {t('placeholder')}
      </span>
    </button>
  )
}
