'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SendHorizonal, X } from 'lucide-react'

interface ProjectContext {
  name: string
  company: string
}

interface CaptureInputProps {
  placeholder: string
  mode: 'registrar' | 'perguntar'
  projectContext?: ProjectContext | null
  onClearProjectContext?: () => void
}

export function CaptureInput({
  placeholder,
  mode,
  projectContext,
  onClearProjectContext,
}: CaptureInputProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (projectContext) textareaRef.current?.focus()
  }, [projectContext])

  async function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('content', trimmed)
      formData.append('kind', mode === 'perguntar' ? 'question' : 'text')

      if (projectContext) {
        formData.append('project_name', projectContext.name)
      }

      const res = await fetch('/api/capture', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        setError(json.error ?? 'Algo deu errado. Tenta de novo?')
        return
      }

      setText('')
      onClearProjectContext?.()
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
    <div className="flex flex-col gap-2 w-full">
      {projectContext && (
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          >
            {projectContext.name}
            <button
              type="button"
              onClick={onClearProjectContext}
              aria-label={`Remover projeto ${projectContext.name}`}
              className="ml-0.5"
            >
              <X size={11} />
            </button>
          </span>
        </div>
      )}
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
      </div>
      {error && (
        <p role="alert" className="sr-only">
          {error}
        </p>
      )}
    </div>
  )
}
