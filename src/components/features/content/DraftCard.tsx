'use client'

import { useTranslations } from 'next-intl'
import type { DraftVariant } from '@/types/content'

interface DraftCardProps {
  variant: DraftVariant
  index: number
}

/**
 * Card de um rascunho gerado. US1: apresentação (ângulo em Fraunces itálico + corpo em Geist).
 * US3 estende com edição inline, copiar e chips de ajuste. Sem card dentro de card (shape).
 */
export function DraftCard({ variant, index }: DraftCardProps) {
  const t = useTranslations('presenca')

  return (
    <article
      data-testid="draft-card"
      aria-label={`${t('formats.post')} ${index + 1}`}
      className="flex flex-col gap-3 rounded-2xl p-4 border"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {variant.angle && (
        <p
          className="text-sm italic"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
        >
          {variant.angle}
        </p>
      )}
      <p className="text-base whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--foreground)' }}>
        {variant.body}
      </p>
    </article>
  )
}
