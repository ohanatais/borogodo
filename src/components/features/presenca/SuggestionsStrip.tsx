'use client'

import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'
import type { ContentSuggestion } from '@/types/content'
import { openPresenca } from '@/components/features/content/presencaEvents'
import { markInsightSeen } from '@/lib/actions/insights'

interface SuggestionsStripProps {
  suggestions: ContentSuggestion[]
}

/**
 * Faixa "Sugestões pra você" (US4): 1 a 3 cartões discretos que abrem a geração com a evidência
 * carregada (reusa `openPresenca` — nunca gera sozinha). **Some quando não há material** (sem
 * placeholder vazio). Ao acionar um nudge, marca o `content_opportunity` como visto.
 */
export function SuggestionsStrip({ suggestions }: SuggestionsStripProps) {
  const t = useTranslations('presenca')
  if (suggestions.length === 0) return null

  function handleClick(s: ContentSuggestion) {
    openPresenca({ seedType: s.seedType, seedRef: s.seedRef, seedSummary: s.seedSummary, formats: s.formats })
    if (s.kind === 'nudge' && s.insightId) void markInsightSeen(s.insightId)
  }

  return (
    <section aria-label={t('suggestions.title')} className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
        {t('suggestions.title')}
      </h2>
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {suggestions.map((s) => (
          <li key={s.id} className="shrink-0 max-w-[260px]">
            <button
              type="button"
              onClick={() => handleClick(s)}
              className="flex items-center gap-2 text-sm px-3 py-2 min-h-[48px] rounded-xl border text-left transition-opacity hover:opacity-80"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <Sparkles size={14} aria-hidden="true" style={{ color: 'var(--color-primary)' }} className="shrink-0" />
              <span className="truncate">{s.seedSummary}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
