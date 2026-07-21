'use client'

import { useState } from 'react'
import type { ChatMessage } from '@/lib/ai/chat/answerCareerQuestion'
import type { PrepMoment } from '@/lib/content/intentions'
import { trackPreparationEvent } from '@/lib/preparation/trackPreparationEvent'

export function ShareConversationButton({ messages, moment }: { messages: ChatMessage[]; moment?: PrepMoment }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function share() {
    setStatus('sending')
    try {
      const response = await fetch('/api/chat/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true, moment, messages }),
      })
      if (!response.ok) throw new Error('share_failed')
      setStatus('sent')
      setOpen(false)
      trackPreparationEvent('conversation_shared', moment, { messageCount: messages.length })
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') return <p className="mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>Conversa compartilhada. Obrigado.</p>

  return (
    <div className="mt-2 w-full max-w-[92%] pl-1">
      {!open ? (
        <button type="button" className="min-h-12 text-xs underline underline-offset-4" style={{ color: 'var(--muted-foreground)' }} onClick={() => setOpen(true)}>
          Compartilhar esta conversa para melhorar o Borogodó
        </button>
      ) : (
        <div className="rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <p className="font-semibold">Compartilhar esta conversa?</p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            O conteúdo será lido pela equipe para melhorar o produto. Nada é compartilhado sem sua confirmação.
          </p>
          {status === 'error' && <p className="mt-2 text-xs" style={{ color: 'var(--destructive)' }}>Não consegui compartilhar agora. Tente novamente.</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="min-h-10 rounded-full px-3 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }} onClick={() => setOpen(false)}>Cancelar</button>
            <button type="button" disabled={status === 'sending'} className="min-h-10 rounded-full px-4 text-xs font-semibold text-white disabled:opacity-60" style={{ background: 'var(--color-primary)' }} onClick={() => void share()}>
              {status === 'sending' ? 'Compartilhando…' : 'Concordo e compartilhar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
