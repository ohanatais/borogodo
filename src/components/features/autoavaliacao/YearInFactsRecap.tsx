'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowUpRight, PenLine } from 'lucide-react'
import type { PeriodRecapItem } from '@/lib/autoavaliacao/periodRecap'

interface YearInFactsRecapProps {
  items: PeriodRecapItem[]
  isLimited: boolean
}

/**
 * "O seu ano, em fatos" (019, US1, T019). Lista factual e DETERMINÍSTICA dos registros do período,
 * cada item com a fonte. Superfície "memória" (tint lilás-névoa) — distinta por TEMPERATURA do branco
 * do editor ("escrever"), não por repetição. Zero adjetivo: é lembrança, não avaliação. Base limitada
 * reconhece e convida a registrar (FR-006), nunca fabrica.
 */
export function YearInFactsRecap({ items, isLimited }: YearInFactsRecapProps) {
  const t = useTranslations('autoavaliacao.recap')
  const locale = useLocale()
  // timeZone UTC: occurredAt date-only é meia-noite UTC; sem isso fusos negativos voltam um dia.
  const dateFmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

  if (isLimited) {
    return (
      <section
        className="rounded-2xl px-6 py-7 text-center"
        style={{ background: 'var(--color-lilas-nevoa)' }}
      >
        <h2 className="text-2xl" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--foreground)' }}>
          {t('label')}
        </h2>
        <p className="text-sm mt-2 mx-auto max-w-md" style={{ color: 'var(--color-lilas-nevoa-text)' }}>
          {t('limited.message')}
        </p>
        <Link
          href="/registros"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium px-5 py-2.5 min-h-[48px] rounded-lg transition-colors"
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
      <h2 className="text-2xl" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--foreground)' }}>
        {t('label')}
      </h2>
      <p className="text-sm mt-1 mb-4" style={{ color: 'var(--muted-foreground)' }}>
        {t('intro')}
      </p>
      <ul className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-lilas-nevoa)' }}>
        {items.map((item, i) => (
          <li
            key={item.sourceEntryId}
            className="group flex items-baseline gap-4 px-5 py-4 sm:gap-6"
            style={i > 0 ? { borderTop: '1px solid oklch(90% 0.01 320)' } : undefined}
          >
            <time
              dateTime={item.occurredAt}
              className="shrink-0 w-20 text-xs tabular-nums leading-relaxed"
              style={{ color: 'var(--color-lilas-nevoa-text)' }}
            >
              {dateFmt.format(new Date(item.occurredAt))}
            </time>
            <p className="flex-1 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
              {item.text}
            </p>
            <Link
              href={`/registros#registro-${item.sourceEntryId}`}
              aria-label={t('sourceChip')}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 min-h-[40px] rounded-lg opacity-70 transition-opacity hover:opacity-100"
              style={{ color: 'var(--color-primary)' }}
            >
              {t('sourceChip')}
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
