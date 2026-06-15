'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Copy } from 'lucide-react'

interface CopyButtonProps {
  /** Texto que vai para a área de transferência. */
  text: string
  /** Chamado só quando a cópia (ou o fallback de seleção) teve sucesso — US4 marca `copied`. */
  onCopied?: () => void
  className?: string
  /** `solid` (geração, CTA forte) ou `subtle` (lista do hub, onde o conteúdo é o protagonista). */
  variant?: 'solid' | 'subtle'
  /** Só ícone (lista densa do hub): mantém a lógica de clipboard e o feedback (✓), sem o rótulo. */
  iconOnly?: boolean
}

const CONFIRM_MS = 2000

/** Copia via Clipboard API; em ambiente sem permissão, cai para `execCommand` com textarea oculto. */
async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // segue para o fallback
    }
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

/**
 * Botão de copiar com confirmação acessível (US3, FR-014). "Copiar" → "Copiado" com região
 * aria-live; quando o clipboard não está disponível, mostra a instrução de seleção manual sem quebrar.
 */
export function CopyButton({ text, onCopied, className = '', variant = 'solid', iconOnly = false }: CopyButtonProps) {
  const t = useTranslations('presenca')
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const handleCopy = useCallback(async () => {
    const ok = await copyText(text)
    if (timer.current) clearTimeout(timer.current)

    if (!ok) {
      setFailed(true)
      return
    }

    setFailed(false)
    setCopied(true)
    onCopied?.()
    timer.current = setTimeout(() => setCopied(false), CONFIRM_MS)
  }, [text, onCopied])

  if (iconOnly) {
    return (
      <>
        <button
          type="button"
          onClick={() => void handleCopy()}
          aria-label={copied ? t('copied') : t('copy')}
          title={copied ? t('copied') : t('copy')}
          className={`inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg transition-colors hover:bg-[var(--muted)] ${className}`}
          style={{ color: copied ? 'var(--color-primary)' : 'var(--muted-foreground)' }}
        >
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? t('copied') : ''}
        </span>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 min-h-[48px] rounded-lg transition-opacity hover:opacity-80 ${className}`}
        style={
          variant === 'subtle'
            ? { background: 'var(--muted)', color: 'var(--foreground)' }
            : { background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }
        }
      >
        {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        {copied ? t('copied') : t('copy')}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? t('copied') : ''}
      </span>
      {failed && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {t('copyFallback')}
        </p>
      )}
    </div>
  )
}
