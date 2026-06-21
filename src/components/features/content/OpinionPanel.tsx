'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'

const THESIS_MAX = 500
const EXAMPLE_MAX = 2000

export interface OpinionPanelProps {
  thesis: string
  onThesisChange: (value: string) => void
  exampleText: string
  onExampleTextChange: (value: string) => void
  onGenerate: () => void
}

/**
 * Painel de opinião (018, revisado). Um campo só — o que a pessoa quer dizer — e um convite
 * opcional a ancorar num exemplo dela (deixa o post mais forte, mas nunca é obrigatório: opinião
 * sem dado é válida). Sem "tese", sem "lastro", sem toggle de modo, sem bloqueio. O botão "Gerar
 * post" só pede que haja algo escrito. Herda o vocabulário visual do GenerateSheet.
 */
export function OpinionPanel({
  thesis,
  onThesisChange,
  exampleText,
  onExampleTextChange,
  onGenerate,
}: OpinionPanelProps) {
  const t = useTranslations('presenca')
  const [exampleOpen, setExampleOpen] = useState(exampleText.trim() !== '')
  const canGenerate = thesis.trim() !== ''

  return (
    <div className="flex flex-col gap-4">
      {/* O que a pessoa quer dizer */}
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

      {/* Convite opcional a ancorar num exemplo — nunca obrigatório */}
      {!exampleOpen ? (
        <button
          type="button"
          onClick={() => setExampleOpen(true)}
          className="self-start inline-flex items-center gap-1.5 text-sm min-h-[48px] transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-accent-text)' }}
        >
          <Plus size={14} aria-hidden="true" />
          {t('opinion.exampleInvite')}
        </button>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {t('opinion.exampleInvite')}
          </span>
          <textarea
            value={exampleText}
            maxLength={EXAMPLE_MAX}
            onChange={(e) => onExampleTextChange(e.target.value)}
            placeholder={t('opinion.examplePlaceholder')}
            rows={4}
            className="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--border)', background: 'var(--color-creme)', color: 'var(--foreground)' }}
          />
        </div>
      )}

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
    </div>
  )
}
