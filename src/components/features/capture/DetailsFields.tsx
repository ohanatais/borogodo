'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { DrawerManualFields } from '@/hooks/useDrawerDraft'

interface DetailsFieldsProps {
  values: DrawerManualFields
  onChange: (field: keyof DrawerManualFields, value: string) => void
}

interface FieldDef {
  field: keyof DrawerManualFields
  labelKey: string
  type: 'text' | 'date'
}

const FIELDS: FieldDef[] = [
  { field: 'metric', labelKey: 'detailsFields.metricLabel', type: 'text' },
  { field: 'impact', labelKey: 'detailsFields.impactLabel', type: 'text' },
  { field: 'tags', labelKey: 'detailsFields.tagsLabel', type: 'text' },
  { field: 'company', labelKey: 'detailsFields.companyLabel', type: 'text' },
  { field: 'entryDate', labelKey: 'detailsFields.dateLabel', type: 'date' },
]

/**
 * Seção opcional "+ adicionar detalhes" (US4) — colapsada por padrão, campos de texto livre sem
 * nenhuma chamada de IA (FR do US4). Abrir a seção é puramente local: nunca dispara rede. Os
 * valores são persistidos verbatim (contracts/capture.md `manualFields`).
 */
export function DetailsFields({ values, onChange }: DetailsFieldsProps) {
  const t = useTranslations('registro')
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 self-start text-xs font-medium"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {open ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
        {t('detailsFields.toggleLabel')}
      </button>

      {open && (
        <div className="grid grid-cols-2 gap-2">
          {FIELDS.map(({ field, labelKey, type }) => (
            <div key={field} className="flex flex-col gap-1">
              <label
                htmlFor={`details-field-${field}`}
                className="text-xs font-medium"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {t(labelKey)}
              </label>
              <input
                id={`details-field-${field}`}
                type={type}
                value={values[field]}
                onChange={(e) => onChange(field, e.target.value)}
                aria-label={t(labelKey)}
                className="rounded-lg px-2.5 py-1.5 text-sm outline-none"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
