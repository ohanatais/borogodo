'use client'

import { useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { resolvePeriodPreset, type PeriodPreset } from '@/lib/content/period'

type Choice = PeriodPreset | 'outro_periodo'

/** Início padrão do range personalizado: este ano, para um ponto de partida sensato. */
function defaultCustomRange(now: Date): { from: string; to: string } {
  return resolvePeriodPreset('este_ano', now)
}

/**
 * Seletor de período da autoavaliação (019, US1, modelo cockpit). Presets como chips (≥48px) com
 * "este ano" pré-selecionado; "outro período" revela dois `<input type="date">` nativos inline. Ao
 * confirmar, navega para `?from=&to=` — a página (RSC) carrega o recap determinístico do intervalo e
 * abre a cabine de escrita. NÃO gera nada (o modelo de geração saiu na Phase 2).
 */
export function PeriodPicker() {
  const t = useTranslations('autoavaliacao')
  const router = useRouter()
  const pathname = usePathname()
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

  function handleStart() {
    if (!isValidRange) return
    router.push(`${pathname}?from=${range.from}&to=${range.to}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="sr-only">{t('presets.outroPeriodo')}</legend>
        {/* Chips e (quando "outro período") os campos De/Até na MESMA linha — datas ao lado do chip,
            não embaixo; quebram para baixo só quando não cabem (mobile). */}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
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
          <div className="flex flex-wrap gap-3 items-end">
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
        </div>
      </fieldset>

      <button
        type="button"
        onClick={handleStart}
        disabled={!isValidRange}
        className="inline-flex items-center justify-center gap-2 self-start text-base font-medium px-5 py-3 min-h-[48px] rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        {t('editor.start')}
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
