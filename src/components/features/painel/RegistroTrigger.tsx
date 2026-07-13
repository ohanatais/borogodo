'use client'

import { useState } from 'react'
import type { ChangeEvent, ClipboardEvent } from 'react'
import { PenLine, ArrowUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { dispatchOpenDrawer } from './registroTriggerEvents'

/**
 * Gatilho único de Registro do Painel (US5, FR-011/FR-012) — substitui a barra fixa
 * "Registrar | Perguntar" e o cartão de Espelho co-igual. Focar (clique ou tab) abre o Drawer
 * vazio; se a pessoa já digitou ou colou algo aqui antes do drawer abrir, esse conteúdo segue
 * com ela (FR-012a) — nada se perde no meio do caminho, porque o foco real passa pro textarea do
 * Drawer assim que ele monta (`autoFocus`).
 */
export function RegistroTrigger() {
  const t = useTranslations('painel.registroTrigger')
  const [value, setValue] = useState('')

  function open(initialText?: string) {
    dispatchOpenDrawer({ initialText })
    setValue('')
  }

  function handleFocus() {
    open()
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value
    setValue(next)
    if (next) open(next)
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData('text')
    if (!text) return
    event.preventDefault()
    open(text)
  }

  return (
    <div
      className="flex items-center gap-3 w-full rounded-2xl px-4 py-3.5"
      style={{ border: '1.5px solid var(--color-accent)', background: 'var(--card)' }}
    >
      <PenLine size={18} className="shrink-0" style={{ color: 'var(--color-accent-text)' }} aria-hidden="true" />
      <input
        type="text"
        value={value}
        onFocus={handleFocus}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={t('label')}
        aria-label={t('ariaLabel')}
        className="flex-1 min-w-0 bg-transparent text-sm outline-none"
        style={{ color: 'var(--foreground)' }}
      />
      <ArrowUp size={16} className="shrink-0" style={{ color: 'var(--color-accent-text)' }} aria-hidden="true" />
    </div>
  )
}
