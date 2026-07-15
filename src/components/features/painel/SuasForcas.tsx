import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { PanelMirror } from '@/lib/panel/getPanelData'

interface SuasForcasProps {
  mirror: PanelMirror | null
}

/**
 * "Suas forças" (US5) — resumo compacto do Espelho em texto inline sublinhado, separado por "·"
 * (design-brief §5): nunca badges/chips, nunca o cartão pesado de Espelho que existia antes
 * (`BorogodoCard`). Reusa os mesmos dados já calculados por `getPanelData` — sem query nova.
 */
export function SuasForcas({ mirror }: SuasForcasProps) {
  const t = useTranslations('painel.suasForcas')
  const themes = mirror?.strengthThemes ?? []

  if (themes.length === 0) return null

  return (
    <section aria-label={t('title')}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-primary)' }}
        >
          {t('title')}
        </h2>
        <Link
          href="/espelho"
          className="group inline-flex items-center gap-1 text-sm font-medium shrink-0 transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('viewMirror')}
          <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <p className="text-base leading-snug" style={{ color: 'var(--foreground)' }}>
        {themes.map((theme, index) => (
          <span key={theme}>
            {index > 0 && <span style={{ color: 'var(--muted-foreground)' }}> · </span>}
            <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--color-lilas-linha)', textUnderlineOffset: '3px' }}>
              {theme}
            </span>
          </span>
        ))}
      </p>
    </section>
  )
}
