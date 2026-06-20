'use client'

import { useLocale, useTranslations } from 'next-intl'
import { ClipboardCheck } from 'lucide-react'
import type { Draft } from '@/types/content'
import { parsePeriodSeedRef } from '@/lib/content/period'
import { resumePresenca } from '@/components/features/content/presencaEvents'

interface SelfAssessmentHistoryProps {
  items: Draft[]
}

/** Rótulo legível do período a partir do `seedRef` (period:::from:::to). Sem range válido → vazio. */
function usePeriodLabel() {
  const locale = useLocale()
  const dateFmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })

  return (seedRef: string | null): string => {
    if (!seedRef) return ''
    const range = parsePeriodSeedRef(seedRef)
    if (!range) return ''
    const from = dateFmt.format(new Date(`${range.from}T12:00:00`))
    const to = dateFmt.format(new Date(`${range.to}T12:00:00`))
    return `${from} – ${to}`
  }
}

/**
 * Histórico de autoavaliações (019). Lista as autoavaliações já geradas/salvas da pessoa — o
 * registro próprio do artefato episódico, separado do feed de registros (`entries`) e, portanto,
 * fora do espelho. Cada linha reabre o texto salvo no fluxo de edição/cópia da 013 (sem regerar),
 * via `resumePresenca` — o `DraftCard` renderiza o `self_assessment` por seções.
 */
export function SelfAssessmentHistory({ items }: SelfAssessmentHistoryProps) {
  const t = useTranslations('autoavaliacao.history')
  const locale = useLocale()
  const periodLabel = usePeriodLabel()
  const dateFmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })

  if (items.length === 0) {
    return (
      <section className="mt-12">
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          {t('title')}
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t('empty')}
        </p>
      </section>
    )
  }

  return (
    <section className="mt-12">
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
        {t('title')}
      </h2>
      <ul className="flex flex-col rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {items.map((draft) => {
          const period = periodLabel(draft.seedRef) || t('untitled')
          return (
            <li key={draft.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() =>
                  resumePresenca({
                    draftId: draft.id,
                    format: draft.format,
                    seedType: draft.seedType,
                    seedRef: draft.seedRef ?? '',
                    angle: draft.angle,
                    body: draft.body,
                    seedSummary: period,
                  })
                }
                className="w-full flex items-center gap-3 min-h-[56px] text-left px-4 py-3 transition-colors hover:bg-[var(--muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]"
              >
                <span
                  className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-primary)' }}
                >
                  <ClipboardCheck size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex flex-col">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                    {period}
                  </span>
                  <time
                    dateTime={draft.createdAt}
                    className="text-xs"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {t('generatedOn', { date: dateFmt.format(new Date(draft.createdAt)) })}
                  </time>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
