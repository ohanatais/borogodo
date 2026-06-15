'use client'

import { useRef, useEffect } from 'react'
import { SendHorizonal } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ value, onChange, onSubmit, disabled, placeholder }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div
      className="flex items-end gap-2 rounded-2xl px-3 py-2 transition-colors"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Aguarde a resposta...' : (placeholder ?? 'Pergunte algo sobre sua carreira...')}
        rows={1}
        disabled={disabled}
        aria-label="Campo de pergunta sobre sua carreira"
        className="flex-1 resize-none text-sm outline-none bg-transparent leading-snug min-h-[24px] max-h-[120px] transition-opacity"
        style={{ color: 'var(--foreground)', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim() || disabled}
        aria-label="Enviar"
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-30"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        <SendHorizonal size={14} />
      </button>
    </div>
  )
}
