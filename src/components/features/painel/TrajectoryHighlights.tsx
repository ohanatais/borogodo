'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { HighlightEntry } from '@/lib/panel/getPanelData'
import { SectionLabel } from '@/components/ui/SectionLabel'

interface TrajectoryHighlightsProps {
  highlights: HighlightEntry[]
}

/**
 * Trajetória em destaque: o painel mostra só o título da conquista (uma linha, escaneável). O
 * detalhe — impacto e métricas — fica sob demanda: a pessoa expande o item que quer aprofundar.
 * Evita a parede de texto e mantém a prova a um clique. Detalhe completo vive no Espelho/Histórico.
 */
export function TrajectoryHighlights({ highlights }: TrajectoryHighlightsProps) {
  const t = useTranslations('panel.highlights')

  if (highlights.length === 0) return null

  return (
    <section aria-label={t('title')}>
      <SectionLabel className="px-4">{t('title')}</SectionLabel>
      <ul
        className="rounded-lg border divide-y overflow-hidden"
        style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
      >
        {highlights.map((entry) => (
          <HighlightRow key={entry.id} entry={entry} expandLabel={t('expand')} />
        ))}
      </ul>
    </section>
  )
}

interface HighlightRowProps {
  entry: HighlightEntry
  expandLabel: string
}

function HighlightRow({ entry, expandLabel }: HighlightRowProps) {
  const [open, setOpen] = useState(false)
  const hasDetail = Boolean(entry.metric || entry.impact)

  return (
    <li style={{ borderColor: 'var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? undefined : expandLabel}
        disabled={!hasDetail}
        className="w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[var(--muted)] disabled:cursor-default"
      >
        <ChevronRight
          size={16}
          aria-hidden="true"
          className={`mt-0.5 shrink-0 transition-transform ${open ? 'rotate-90' : ''} ${hasDetail ? '' : 'opacity-0'}`}
          style={{ color: 'var(--color-primary)' }}
        />
        <span
          className={`text-sm font-medium leading-snug ${open ? '' : 'line-clamp-1'}`}
          style={{ color: 'var(--foreground)' }}
        >
          {entry.what_i_did}
        </span>
      </button>

      {open && hasDetail && (
        <div className="px-4 pb-3 pl-[2.625rem] flex flex-col gap-1.5">
          {entry.metric && (
            <span
              className="self-start inline-block px-2 py-0.5 rounded text-xs font-semibold"
              style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-primary)' }}
            >
              {entry.metric}
            </span>
          )}
          {entry.impact && (
            <p className="text-xs leading-snug" style={{ color: 'var(--muted-foreground)' }}>
              {entry.impact}
            </p>
          )}
        </div>
      )}
    </li>
  )
}
