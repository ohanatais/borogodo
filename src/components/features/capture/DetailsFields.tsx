'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, TrendingUp, Target, Tag, Building2, CalendarDays, X } from 'lucide-react'
import type { DrawerManualFields } from '@/hooks/useDrawerDraft'
import { ContextPillPicker } from '@/components/features/feed/ContextPillPicker'

interface DetailsFieldsProps {
  values: DrawerManualFields
  onChange: <K extends keyof DrawerManualFields>(field: K, value: DrawerManualFields[K]) => void
  /** "Organizar" (026) força a seção aberta pra mostrar o que preencheu — sem isso, ela ficaria
   * escondida atrás do toggle mesmo depois de a IA já ter preenchido os campos. */
  forceOpen?: boolean
  /** Vocabulário de contextos da pessoa (Story 2, `getContextVocabulary`) — alimenta o
   * `ContextPillPicker` de empresa/projeto pessoal, aqui em modo local (sem `entryId`): a
   * seleção só atualiza o rascunho, nenhum `PATCH` acontece antes de salvar/editar de verdade. */
  contextVocabulary?: string[]
  /** `true` ao editar uma fonte com 2+ destaques reais (revisão pós-implementação, 026) — Métrica
   * e Impacto representam UM destaque só, sem sentido pra uma fonte com vários (e sem efeito
   * visível: nenhuma tela mostra esses campos legados quando há 2+ destaques). Escondidos, com uma
   * explicação no lugar em vez de somem sem dizer por quê. */
  hideMetricImpact?: boolean
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

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

/**
 * Seção opcional "+ adicionar detalhes" (US4) — colapsada por padrão, campos de texto livre sem
 * nenhuma chamada de IA (FR do US4). Abrir a seção é puramente local: nunca dispara rede. Os
 * valores são persistidos verbatim (contracts/capture.md `manualFields`).
 */
export function DetailsFields({ values, onChange, forceOpen, contextVocabulary = [], hideMetricImpact }: DetailsFieldsProps) {
  const t = useTranslations('registro')
  const [open, setOpen] = useState(false)
  // Tags já commitadas aparecem como pílula (com X pra remover); este é só o texto da PRÓXIMA
  // tag, ainda sendo digitada — nunca duplica o que já virou pílula.
  const [tagDraft, setTagDraft] = useState('')

  function commitTagSegments(nextValue: string) {
    if (!nextValue.includes(',')) {
      setTagDraft(nextValue)
      return
    }
    const segments = nextValue.split(',').map((s) => s.trim()).filter(Boolean)
    const merged = Array.from(new Set([...parseTags(values.tags), ...segments]))
    onChange('tags', merged.join(', '))
    setTagDraft('')
  }

  function commitTagDraft() {
    const trimmed = tagDraft.trim()
    if (!trimmed) return
    const merged = Array.from(new Set([...parseTags(values.tags), trimmed]))
    onChange('tags', merged.join(', '))
    setTagDraft('')
  }
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

      {hideMetricImpact ? (
        <p className="text-xs leading-snug px-1" style={{ color: 'var(--muted-foreground)' }}>
          {t('detailsFields.multiHighlightHint')}
        </p>
      ) : (
        <>
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
        </>
      )}

      <FieldRow icon={Tag} label={t('detailsFields.tagsLabel')} htmlFor="details-field-tags">
        <div className="flex flex-col gap-2">
          {parseTags(values.tags).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {parseTags(values.tags).map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const next = parseTags(values.tags).filter((_, i) => i !== index)
                      onChange('tags', next.join(', '))
                    }}
                    aria-label={`${t('detailsFields.removeTagAriaLabel')} ${tag}`}
                    className="opacity-80 hover:opacity-100"
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            id="details-field-tags"
            type="text"
            value={tagDraft}
            onChange={(e) => commitTagSegments(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitTagDraft()
              }
            }}
            onBlur={commitTagDraft}
            placeholder={t('detailsFields.tagsPlaceholder')}
            aria-label={t('detailsFields.tagsLabel')}
            className="w-full bg-transparent outline-none focus-visible:shadow-none text-sm"
            style={fieldInputStyle}
          />
        </div>
      </FieldRow>

      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
          <Building2 size={13} aria-hidden="true" />
          {t('detailsFields.companyLabel')}
        </span>
        <div className="rounded-lg px-3 py-2" style={{ background: 'var(--color-lilas-nevoa)' }}>
          <ContextPillPicker
            company={values.company || null}
            isPersonalProject={values.isPersonalProject}
            vocabulary={contextVocabulary}
            onChange={(next) => {
              onChange('company', next.company ?? '')
              onChange('isPersonalProject', next.isPersonalProject)
            }}
          />
        </div>
      </div>

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
