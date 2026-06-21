'use client'

import { useTranslations } from 'next-intl'
import type { AngleKind } from '@/types/content'

/** Valor de seleção do seletor: `null` = ângulo padrão (relato); `'study'` = estudo. */
export type AngleValue = AngleKind | null

interface AngleSelectorProps {
  selected: AngleValue
  onSelect: (angle: AngleValue) => void
  disabled?: boolean
}

interface AngleChip {
  value: AngleValue
  labelKey: string
}

const ANGLE_CHIPS: AngleChip[] = [
  { value: null, labelKey: 'angles.relato' },
  { value: 'study', labelKey: 'angles.study' },
  { value: 'opinion', labelKey: 'angles.opinion' },
]

/**
 * Seletor de ângulo do post (018 US1). Chips leves no mesmo vocabulário visual do seletor de
 * formato do GenerateSheet. "Relato" = ângulo padrão (sem angleKind); "Estudo" reorienta as
 * variantes para o aprendizado ancorado na evidência. Opinião (US2) entra na Phase 4.
 */
export function AngleSelector({ selected, onSelect, disabled }: AngleSelectorProps) {
  const t = useTranslations('presenca')

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {t('angles.label')}
      </span>
      <div className="flex gap-2" role="group" aria-label={t('angles.label')}>
        {ANGLE_CHIPS.map((chip) => {
        const active = chip.value === selected
        return (
          <button
            key={chip.labelKey}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onSelect(chip.value)}
            className="inline-flex items-center justify-center text-sm px-3 py-1.5 min-h-[48px] rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none"
            style={{
              background: active ? 'var(--color-primary)' : 'var(--muted)',
              color: active ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
            }}
          >
            {t(chip.labelKey)}
          </button>
        )
        })}
      </div>
    </div>
  )
}
