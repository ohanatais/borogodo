'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

const THESIS_MAX = 500
const LASTRO_MAX = 2000

type LastroMode = 'entry' | 'writeNow'

interface OpinionEntry {
  ref: string
  label: string
}

export interface OpinionPanelProps {
  thesis: string
  onThesisChange: (value: string) => void
  lastroMode: LastroMode | null
  onLastroModeChange: (mode: LastroMode) => void
  entries: OpinionEntry[]
  selectedEntryRef: string | null
  onSelectEntry: (ref: string) => void
  lastroText: string
  onLastroTextChange: (value: string) => void
  onGenerate: () => void
  error: string | null
}

interface LastroOption {
  mode: LastroMode
  labelKey: 'opinion.fromEntry' | 'opinion.writeNow'
}

const LASTRO_OPTIONS: LastroOption[] = [
  { mode: 'entry', labelKey: 'opinion.fromEntry' },
  { mode: 'writeNow', labelKey: 'opinion.writeNow' },
]

/**
 * Painel inline de opinião (018 US2). Tese (max 500) + escolha de lastro (entrada registrada ou
 * vivência escrita na hora). Botão "Gerar" desabilitado sem tese. Erro de lastro em texto inline,
 * sem modal. Herda o vocabulário visual do GenerateSheet (tokens de cor, card inline).
 */
export function OpinionPanel({
  thesis,
  onThesisChange,
  lastroMode,
  onLastroModeChange,
  entries,
  selectedEntryRef,
  onSelectEntry,
  lastroText,
  onLastroTextChange,
  onGenerate,
  error,
}: OpinionPanelProps) {
  const t = useTranslations('presenca')
  const canGenerate = thesis.trim() !== ''

  return (
    <div className="flex flex-col gap-4">
      {/* Tese */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="opinion-thesis" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {t('opinion.thesisLabel')}
        </label>
        <textarea
          id="opinion-thesis"
          value={thesis}
          maxLength={THESIS_MAX}
          onChange={(e) => onThesisChange(e.target.value)}
          placeholder={t('opinion.thesisPlaceholder')}
          rows={3}
          className="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: 'var(--border)', background: 'var(--color-creme)', color: 'var(--foreground)' }}
        />
        <span className="self-end text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {thesis.length}/{THESIS_MAX}
        </span>
      </div>

      {/* Lastro */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {t('opinion.lastroLabel')}
        </span>
        <div className="flex gap-2">
          {LASTRO_OPTIONS.map((opt) => {
            const active = opt.mode === lastroMode
            return (
              <button
                key={opt.mode}
                type="button"
                aria-pressed={active}
                onClick={() => onLastroModeChange(opt.mode)}
                className="inline-flex items-center justify-center text-sm px-3 py-1.5 min-h-[48px] rounded-full transition-colors"
                style={{
                  background: active ? 'var(--color-primary)' : 'var(--muted)',
                  color: active ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
                }}
              >
                {t(opt.labelKey)}
              </button>
            )
          })}
        </div>

        {lastroMode === 'entry' && (
          <ul className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {entries.map((entry) => {
              const selected = entry.ref === selectedEntryRef
              return (
                <li key={entry.ref}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSelectEntry(entry.ref)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm min-h-[48px] transition-colors"
                    style={{
                      borderColor: selected ? 'var(--color-primary)' : 'var(--border)',
                      background: selected ? 'var(--muted)' : 'transparent',
                      color: 'var(--foreground)',
                    }}
                  >
                    <span className="truncate">{entry.label}</span>
                    {selected && <Check size={16} style={{ color: 'var(--color-primary)' }} />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {lastroMode === 'writeNow' && (
          <div className="flex flex-col gap-1.5 rounded-lg border p-3" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {t('opinion.writeNowTitle')}
            </span>
            <textarea
              value={lastroText}
              maxLength={LASTRO_MAX}
              onChange={(e) => onLastroTextChange(e.target.value)}
              placeholder={t('opinion.writeNowPlaceholder')}
              rows={4}
              className="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--border)', background: 'var(--color-creme)', color: 'var(--foreground)' }}
            />
          </div>
        )}
      </div>

      {/* Gerar */}
      <button
        type="button"
        disabled={!canGenerate}
        onClick={onGenerate}
        className="inline-flex items-center justify-center text-sm font-medium px-4 py-2.5 min-h-[48px] rounded-lg transition-opacity disabled:opacity-50 disabled:pointer-events-none"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        {t('opinion.generateBtn')}
      </button>

      {error === 'opinion_needs_lastro' && (
        <p className="text-sm" style={{ color: 'var(--destructive)' }}>
          {t('opinion.needsLastroError')}
        </p>
      )}
    </div>
  )
}
