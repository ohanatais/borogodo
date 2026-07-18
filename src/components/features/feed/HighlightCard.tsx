'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import type { FeedHighlight } from '@/lib/feed/types'

interface HighlightCardProps {
  highlight: FeedHighlight
  /** Aberto por padrão quando é o único destaque da fonte (FR-017) — decidido pelo pai (contagem). */
  defaultOpen: boolean
  /** Posição (1-based) na lista de destaques da fonte — alimenta o círculo numerado do redesign
   * visual (mockup Registros). Opcional para não quebrar quem ainda não passa essa informação. */
  index?: number
}

/**
 * Um destaque dentro de uma fonte (US4, feature 026) — exibição pura, conteúdo 100% derivado do
 * "Organizar" (revisão pós-implementação: destaque deixou de ter edição/exclusão isolada — o que
 * pode ser editado ou excluído é o REGISTRO em si, via Drawer/card; um destaque errado se corrige
 * editando o texto cru e reorganizando, que agora substitui os destaques em vez de só somar).
 * Aberto por padrão quando é o único destaque da fonte (FR-017, decidido pelo pai via
 * `defaultOpen`); ausência de métrica é válida, nunca tratada como erro (FR-018) — o campo
 * simplesmente não aparece.
 */
export function HighlightCard({ highlight, defaultOpen, index }: HighlightCardProps) {
  const t = useTranslations('registro')
  const [expanded, setExpanded] = useState(defaultOpen)

  const summaryTitle = highlight.title || t('highlight.untitled')

  return (
    <div
      className="rounded-lg"
      style={{
        background: 'var(--color-accent-wash)',
        borderTop: '1px solid color-mix(in oklch, var(--border) 50%, transparent)',
        borderRight: '1px solid color-mix(in oklch, var(--border) 50%, transparent)',
        borderBottom: '1px solid color-mix(in oklch, var(--border) 50%, transparent)',
        borderLeft: '3px solid var(--color-accent)',
      }}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? t('highlight.collapse') : t('highlight.expand')}
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-2 px-3 py-2 text-left min-h-[48px] transition-opacity hover:opacity-80"
        style={{ color: 'var(--foreground)' }}
      >
        {index !== undefined && (
          <span
            aria-hidden="true"
            className="mt-0.5 flex shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
            style={{ width: 18, height: 18, background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
          >
            {index}
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold leading-snug">{summaryTitle}</span>
          {highlight.metric && (
            <span
              className="mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
            >
              <TrendingUp size={11} aria-hidden="true" />
              {highlight.metric}
            </span>
          )}
        </span>
        <span className="shrink-0 mt-0.5" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {highlight.impact && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              {highlight.impact}
            </p>
          )}
          {highlight.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {highlight.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
