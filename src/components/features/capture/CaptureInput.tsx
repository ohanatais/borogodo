'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SendHorizonal } from 'lucide-react'

interface CaptureInputProps {
  placeholder: string
  mode: 'registrar' | 'perguntar'
}

export function CaptureInput({ placeholder, mode }: CaptureInputProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, kind: mode === 'perguntar' ? 'question' : 'text' }),
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        setError(json.error ?? 'Algo deu errado. Tenta de novo?')
        return
      }

      setText('')
      router.refresh()
    } catch {
      setError('Erro de conexão. Tenta de novo?')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div className="flex items-end gap-2 w-full">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        aria-label={placeholder}
        disabled={loading}
        className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none min-h-[44px] max-h-[120px] leading-snug"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
        }}
        onInput={(e) => {
          const el = e.currentTarget
          el.style.height = 'auto'
          el.style.height = `${el.scrollHeight}px`
        }}
      />
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={!text.trim() || loading}
        aria-label="Enviar"
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        <SendHorizonal size={16} />
      </button>
      {error && (
        <p role="alert" className="sr-only">
          {error}
        </p>
      )}
    </div>
  )
}
