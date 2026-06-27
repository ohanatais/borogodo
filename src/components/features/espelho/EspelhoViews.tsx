'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { EspelhoVista } from './vista'

interface EspelhoViewsProps {
  vista: EspelhoVista
}

const TABS: { id: EspelhoVista; labelKey: string }[] = [
  { id: 'forcas', labelKey: 'forcas' },
  { id: 'trajetoria', labelKey: 'trajetoria' },
]

/**
 * Segmented control do Espelho: Forças ↔ Trajetória. A vista vive na URL (`?vista=`),
 * então cada aba é um link — a página (RSC) busca só os dados da vista ativa.
 */
export function EspelhoViews({ vista }: EspelhoViewsProps) {
  const t = useTranslations('espelho.views')

  return (
    <div
      role="group"
      aria-label="Vistas do Espelho"
      className="inline-flex items-center p-0.5 rounded-full"
      style={{ background: 'oklch(100% 0 0 / 0.7)' }}
    >
      {TABS.map((tab) => {
        const active = tab.id === vista
        return (
          <Link
            key={tab.id}
            href={tab.id === 'forcas' ? '/espelho' : `/espelho?vista=${tab.id}`}
            aria-pressed={active}
            aria-current={active ? 'page' : undefined}
            className="text-sm px-4 rounded-full transition-[background-color,color,opacity] hover:opacity-80 flex items-center justify-center min-h-12"
            style={{
              background: active ? 'var(--color-primary)' : 'transparent',
              color: active ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
              fontWeight: active ? 600 : 400,
            }}
          >
            {t(tab.labelKey)}
          </Link>
        )
      })}
    </div>
  )
}
