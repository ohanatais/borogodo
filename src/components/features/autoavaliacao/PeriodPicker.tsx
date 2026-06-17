'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'
import {
  resolvePeriodPreset,
  serializePeriodSeedRef,
  type PeriodPreset,
} from '@/lib/content/period'
import { openPresenca } from '@/components/features/content/presencaEvents'

type Choice = PeriodPreset | 'outro_periodo'

/** Início padrão do range personalizado: este ano, para um ponto de partida sensato. */
function defaultCustomRange(now: Date): { from: string; to: string } {
  return resolvePeriodPreset('este_ano', now)
}

/**
 * Seletor de período da autoavaliação (019, US1). Presets como chips (≥48px) com "este ano"
 * pré-selecionado; "outro período" revela dois `<input type="date">` nativos inline (acessível,
 * mobile-friendly, sem dependência nova). "Gerar autoavaliação" dispara o MESMO mecanismo da
 * Presença — evento `openPresenca` com `seedType: 'period'` e o `seedRef` codificado pelo `period.ts`
 * — abrindo o `GenerateSheet` montado no AppShell, que já gera com a evidência do intervalo.
 */
export function PeriodPicker() {
  const t = useTranslations('autoavaliacao')
  const now = useMemo(() => new Date(), [])
  const initialCustom = useMemo(() => defaultCustomRange(now), [now])

  const [choice, setChoice] = useState<Choice>('este_ano')
  const [customFrom, setCustomFrom] = useState(initialCustom.from)
  const [customTo, setCustomTo] = useState(initialCustom.to)

  const presets: ReadonlyArray<{ value: Choice; label: string }> = [
    { value: 'este_ano', label: t('presets.esteAno') },
    { value: 'ultimo_ciclo', label: t('presets.ultimoCiclo') },
    { value: 'outro_periodo', label: t('presets.outroPeriodo') },
  ]

  const range =
    choice === 'outro_periodo'
      ? { from: customFrom, to: customTo }
      : resolvePeriodPreset(choice, now)

  const isValidRange = Boolean(range.from && range.to && range.from <= range.to)

  function handleGenerate() {
    if (!isValidRange) return
    const seedRef = serializePeriodSeedRef(range.from, range.to)
    const seedSummary = t('basedOnPeriod', { from: range.from, to: range.to })
    openPresenca({
      seedType: 'period',
      seedRef,
      seedSummary,
      formats: ['self_assessment'],
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{t('presets.outroPeriodo')}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('title')}>
          {presets.map((preset) => {
            const active = choice === preset.value
            return (
              <button
                key={preset.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setChoice(preset.value)}
                className="inline-flex items-center justify-center text-sm px-4 py-2 min-h-[48px] rounded-full border transition-colors"
                style={{
                  background: active ? 'var(--color-primary)' : 'var(--card)',
                  borderColor: active ? 'var(--color-primary)' : 'var(--border)',
                  color: active ? 'var(--color-primary-fg)' : 'var(--foreground)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {preset.label}
              </button>
            )
          })}
        </div>

        {choice === 'outro_periodo' && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {t('range.from')}
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="min-h-[48px] rounded-lg border px-3 text-base"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {t('range.to')}
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className="min-h-[48px] rounded-lg border px-3 text-base"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </label>
          </div>
        )}
      </fieldset>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!isValidRange}
        className="inline-flex items-center justify-center gap-2 self-start text-base font-medium px-5 py-3 min-h-[48px] rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        <Sparkles size={16} aria-hidden="true" />
        {t('generate')}
      </button>
    </div>
  )
}
