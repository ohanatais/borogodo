'use client'

import { useTranslations } from 'next-intl'
import { Segmented } from '@/components/ui/Segmented'
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
 * então cada aba é um link — a página (RSC) busca só os dados da vista ativa. Usa o
 * componente Segmented padrão do sistema (021).
 */
export function EspelhoViews({ vista }: EspelhoViewsProps) {
  const t = useTranslations('espelho.views')

  return (
    <Segmented
      ariaLabel="Vistas do Espelho"
      items={TABS.map((tab) => ({
        key: tab.id,
        label: t(tab.labelKey),
        active: tab.id === vista,
        href: tab.id === 'forcas' ? '/espelho' : `/espelho?vista=${tab.id}`,
      }))}
    />
  )
}
