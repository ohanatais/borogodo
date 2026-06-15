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
}

/**
 * Ponto de entrada reusável da Presença (013/014/015). Abre a superfície de geração já com a
 * evidência carregada. Acento roxo-jambo discreto, toque ≥ 44px via área estendida.
 */
export function UsarButton({ seedType, seedRef, seedSummary, formats, className = '' }: UsarButtonProps) {
  const t = useTranslations('presenca')

  return (
    <button
      type="button"
      onClick={() => openPresenca({ seedType, seedRef, seedSummary, formats })}
      aria-label={`${t('use')}: ${seedSummary}`}
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-opacity hover:opacity-80 ${className}`}
      style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-primary)' }}
    >
      <Sparkles size={12} aria-hidden="true" />
      {t('use')}
    </button>
  )
}
