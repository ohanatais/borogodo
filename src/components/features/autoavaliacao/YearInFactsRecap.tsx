'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { FileText, PenLine } from 'lucide-react'
import type { PeriodRecapItem } from '@/lib/autoavaliacao/periodRecap'

interface YearInFactsRecapProps {
  items: PeriodRecapItem[]
  isLimited: boolean
}

/**
 * "O seu ano, em fatos" (019, US1, T019). Lista factual e DETERMINÍSTICA dos registros do período —
 * cada item com um chip de fonte que aponta para o registro de origem. Zero adjetivo: é memória, não
 * avaliação. Base limitada reconhece e convida a registrar (FR-006), nunca fabrica item.
 */
export function YearInFactsRecap({ items, isLimited }: YearInFactsRecapProps) {
  const t = useTranslations('autoavaliacao.recap')
  const locale = useLocale()
  // timeZone UTC: occurredAt date-only (YYYY-MM-DD) é meia-noite UTC; sem isso, fusos negativos
  // voltam um dia ("2026-01-01" → "31 dez 2025").
  const dateFmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

  if (isLimited) {
    return (
      <section className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="text-lg" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--foreground)' }}>
          {t('label')}
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
          {t('limited.message')}
        </p>
        <Link
          href="/registros"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 min-h-[48px] rounded-lg transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          <PenLine size={16} aria-hidden="true" />
          {t('limited.cta')}
        </Link>
      </section>
    )
  }

  return (
    <section aria-label={t('label')}>
      <h2 className="text-lg" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--foreground)' }}>
        {t('label')}
      </h2>
      <p className="text-sm mt-1 mb-4" style={{ color: 'var(--muted-foreground)' }}>
        {t('intro')}
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.sourceEntryId}
            className="flex items-start justify-between gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <div className="min-w-0">
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                {item.text}
              </p>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {dateFmt.format(new Date(item.occurredAt))}
              </span>
            </div>
            <Link
              href={`/registros#registro-${item.sourceEntryId}`}
              aria-label={t('sourceChip')}
              className="shrink-0 inline-flex items-center gap-1 text-xs px-2.5 py-1 min-h-[40px] rounded-full transition-opacity hover:opacity-80"
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              <FileText size={13} aria-hidden="true" />
              {t('sourceChip')}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
