'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, TrendingUp, Target, Tag, Building2, CalendarDays } from 'lucide-react'
import type { DrawerManualFields } from '@/hooks/useDrawerDraft'

interface DetailsFieldsProps {
  values: DrawerManualFields
  onChange: (field: keyof DrawerManualFields, value: string) => void
  /** "Organizar" (026) força a seção aberta pra mostrar o que preencheu — sem isso, ela ficaria
   * escondida atrás do toggle mesmo depois de a IA já ter preenchido os campos. */
  forceOpen?: boolean
}

/**
 * Linha de campo editável — ícone + label acima, campo num container tingido (mesma gramática
 * visual do resto do produto: `--color-lilas-nevoa`), em vez da grade 2 colunas anterior que
 * espremia mal quando havia anexo + detalhes juntos.
 */
function FieldRow({
  icon: Icon,
  label,
  htmlFor,
  children,
}: {
  icon: typeof TrendingUp
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
        <Icon size={13} aria-hidden="true" />
        {label}
      </label>
      <div className="rounded-lg px-3 py-2" style={{ background: 'var(--color-lilas-nevoa)' }}>
        {children}
      </div>
    </div>
  )
}

const fieldInputStyle: React.CSSProperties = { color: 'var(--foreground)' }

/**
 * Seção opcional "+ adicionar detalhes" (US4) — colapsada por padrão, campos de texto livre sem
 * nenhuma chamada de IA (FR do US4). Abrir a seção é puramente local: nunca dispara rede. Os
 * valores são persistidos verbatim (contracts/capture.md `manualFields`).
 */
export function DetailsFields({ values, onChange, forceOpen }: DetailsFieldsProps) {
  const t = useTranslations('registro')
  const [open, setOpen] = useState(false)
  // "Organizar" forçando a seção aberta — mesmo padrão de "ajustar estado durante o render" já
  // usado em `FeedPage.tsx` (resync de props em vez de useEffect + setState).
  const [prevForceOpen, setPrevForceOpen] = useState(forceOpen)
  if (forceOpen && forceOpen !== prevForceOpen) {
    setPrevForceOpen(forceOpen)
    setOpen(true)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="inline-flex items-center gap-1.5 self-start text-xs font-medium px-3 py-2 rounded-lg border border-dashed"
        style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
      >
        <Plus size={13} aria-hidden="true" />
        {t('detailsFields.toggleLabel')}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
          {t('detailsFields.sectionLabel')}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-expanded={true}
          className="text-xs font-medium"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {t('detailsFields.collapseLabel')}
        </button>
      </div>

      <FieldRow icon={TrendingUp} label={t('detailsFields.metricLabel')} htmlFor="details-field-metric">
        <input
          id="details-field-metric"
          type="text"
          value={values.metric}
          onChange={(e) => onChange('metric', e.target.value)}
          placeholder={t('detailsFields.metricPlaceholder')}
          aria-label={t('detailsFields.metricLabel')}
          className="w-full bg-transparent outline-none focus-visible:shadow-none text-sm font-medium"
          style={fieldInputStyle}
        />
      </FieldRow>

      <FieldRow icon={Target} label={t('detailsFields.impactLabel')} htmlFor="details-field-impact">
        <textarea
          id="details-field-impact"
          rows={2}
          value={values.impact}
          onChange={(e) => onChange('impact', e.target.value)}
          placeholder={t('detailsFields.impactPlaceholder')}
          aria-label={t('detailsFields.impactLabel')}
          className="w-full resize-none bg-transparent outline-none focus-visible:shadow-none text-sm leading-snug"
          style={fieldInputStyle}
        />
      </FieldRow>

      <FieldRow icon={Tag} label={t('detailsFields.tagsLabel')} htmlFor="details-field-tags">
        <input
          id="details-field-tags"
          type="text"
          value={values.tags}
          onChange={(e) => onChange('tags', e.target.value)}
          placeholder={t('detailsFields.tagsPlaceholder')}
          aria-label={t('detailsFields.tagsLabel')}
          className="w-full bg-transparent outline-none focus-visible:shadow-none text-sm"
          style={fieldInputStyle}
        />
      </FieldRow>

      <FieldRow icon={Building2} label={t('detailsFields.companyLabel')} htmlFor="details-field-company">
        <input
          id="details-field-company"
          type="text"
          value={values.company}
          onChange={(e) => onChange('company', e.target.value)}
          placeholder={t('detailsFields.companyPlaceholder')}
          aria-label={t('detailsFields.companyLabel')}
          className="w-full bg-transparent outline-none focus-visible:shadow-none text-sm font-medium"
          style={fieldInputStyle}
        />
      </FieldRow>

      <FieldRow icon={CalendarDays} label={t('detailsFields.dateLabel')} htmlFor="details-field-date">
        <input
          id="details-field-date"
          type="date"
          value={values.entryDate}
          onChange={(e) => onChange('entryDate', e.target.value)}
          aria-label={t('detailsFields.dateLabel')}
          className="w-full bg-transparent outline-none focus-visible:shadow-none text-sm font-medium"
          style={fieldInputStyle}
        />
      </FieldRow>
    </div>
  )
}
