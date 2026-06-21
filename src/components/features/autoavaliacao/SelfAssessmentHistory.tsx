'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ClipboardCheck, CalendarClock } from 'lucide-react'
import type { Draft } from '@/types/content'
import { parsePeriodSeedRef } from '@/lib/content/period'

interface SelfAssessmentHistoryProps {
  items: Draft[]
  /** Próxima revisão agendada (ISO date), ou null sem recorrência. Mostrada no topo. */
  nextReviewDate?: string | null
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
 * Histórico de autoavaliações (019, US3). Lista as autoavaliações ESCRITAS da pessoa — o registro
 * próprio do artefato episódico, separado do feed (`entries`) e do espelho. Cada linha REABRE o texto
 * na própria cabine para edição (`?draft=<id>`), nunca no fluxo de post (GenerateSheet) — coerente com
 * a separação do modelo cockpit.
 */
export function SelfAssessmentHistory({ items, nextReviewDate }: SelfAssessmentHistoryProps) {
  const t = useTranslations('autoavaliacao.history')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const periodLabel = usePeriodLabel()
  const dateFmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })

  // Revisão agendada (do perfil) — o topo da visão; o histórico abaixo são as revisões passadas.
  const scheduled = nextReviewDate ? (
    <p
      className="inline-flex items-center gap-1.5 text-sm rounded-lg px-3 py-2 mb-4"
      style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-lilas-nevoa-text)' }}
    >
      <CalendarClock size={15} aria-hidden="true" />
      {t('nextReview', { date: dateFmt.format(new Date(`${nextReviewDate}T12:00:00`)) })}
    </p>
  ) : null

  if (items.length === 0) {
    return (
      <section className="mt-12">
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          {t('title')}
        </h2>
        {scheduled}
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
      {scheduled}
      <ul className="flex flex-col rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {items.map((draft) => {
          const period = periodLabel(draft.seedRef) || t('untitled')
          return (
            <li key={draft.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => router.push(`${pathname}?draft=${draft.id}`)}
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
                    {t('writtenOn', { date: dateFmt.format(new Date(draft.createdAt)) })}
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
