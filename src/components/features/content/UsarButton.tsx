'use client'

import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'
import type { DraftFormat, SeedType } from '@/types/content'
import { openPresenca } from './presencaEvents'

interface UsarButtonProps {
  seedType: SeedType
  seedRef: string
  seedSummary: string
  formats: DraftFormat[]
  className?: string
  /** Rótulo visível; default "Usar". A US3 passa "Usar este projeto" no painel do histórico. */
  label?: string
}

/**
 * Ponto de entrada reusável da Presença (013/014/015). Abre a superfície de geração já com a
 * evidência carregada. Acento roxo-jambo discreto, alvo de toque ≥ 48px no mobile via min-h.
 */
export function UsarButton({ seedType, seedRef, seedSummary, formats, className = '', label }: UsarButtonProps) {
  const t = useTranslations('presenca')
  const text = label ?? t('use')

  return (
    <button
      type="button"
      onClick={() => openPresenca({ seedType, seedRef, seedSummary, formats })}
      aria-label={`${text}: ${seedSummary}`}
      className={`inline-flex items-center gap-1 text-xs font-medium px-4 py-2.5 rounded-full transition-opacity hover:opacity-80 ${className}`}
      style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-primary)' }}
    >
      <Sparkles size={12} aria-hidden="true" />
      {text}
    </button>
  )
}
