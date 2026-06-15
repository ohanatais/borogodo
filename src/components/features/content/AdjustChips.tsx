'use client'

import { useTranslations } from 'next-intl'
import type { AdjustKind } from '@/types/content'

interface AdjustChipsProps {
  /** Aplica o ajuste regerando o par mantendo a evidência (US3, FR-013). */
  onAdjust: (adjust: AdjustKind) => void
  /** Some interação enquanto uma geração está em curso. */
  disabled?: boolean
}

const CHIPS: ReadonlyArray<{ kind: AdjustKind; labelKey: string }> = [
  { kind: 'mais_curto', labelKey: 'adjust.shorter' },
  { kind: 'menos_formal', labelKey: 'adjust.lessFormal' },
  { kind: 'tira_jargao', labelKey: 'adjust.removeJargon' },
]

/**
 * Chips de ajuste rápido (T029). Operam sobre a geração inteira: o motor sempre devolve 2 variações
 * a partir do seed, então o ajuste reescreve o par com a instrução (mais curto / menos formal / tira
 * o jargão), nunca um card isolado. Edição, cópia e "soa como você?" continuam por card.
 */
export function AdjustChips({ onAdjust, disabled = false }: AdjustChipsProps) {
  const t = useTranslations('presenca')

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('adjust.label')}>
      {CHIPS.map(({ kind, labelKey }) => (
        <button
          key={kind}
          type="button"
          onClick={() => onAdjust(kind)}
          disabled={disabled}
          className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--card)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
          }}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  )
}
