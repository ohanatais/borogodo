'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { copyText } from '@/lib/clipboard'

interface CopyButtonProps {
  /** Texto que vai para a área de transferência. */
  value: string
  /** Rótulo padrão do botão (ex.: "Copiar e-mail"). */
  copyLabel: string
  /** Rótulo de confirmação ("Copiado!"). */
  copiedLabel: string
  /** Mensagem quando o clipboard está indisponível/bloqueado. */
  failedLabel: string
  className?: string
}

const CONFIRM_MS = 2000

/**
 * Botão de copiar genérico com confirmação acessível. Os rótulos vêm via props (i18n fica
 * a cargo de quem usa) para o componente servir tanto à LP quanto ao app sem acoplar a um
 * namespace. A cópia usa o helper `copyText` (Clipboard API + fallback `execCommand`); só quando
 * nem o fallback funciona mostra a instrução de seleção manual — o e-mail continua selecionável
 * ao lado, sem travar (FR-002, FR-009).
 */
export function CopyButton({ value, copyLabel, copiedLabel, failedLabel, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const handleCopy = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)

    const ok = await copyText(value)
    if (!ok) {
      setCopied(false)
      setFailed(true)
      return
    }

    setFailed(false)
    setCopied(true)
    timer.current = setTimeout(() => setCopied(false), CONFIRM_MS)
  }, [value])

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={`inline-flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 ${className}`}
        style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
      >
        {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        {copied ? copiedLabel : copyLabel}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ''}
      </span>
      {failed && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {failedLabel}
        </p>
      )}
    </div>
  )
}
