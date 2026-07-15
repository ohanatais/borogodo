'use client'

import { useState } from 'react'
import { Segmented } from '@/components/ui/Segmented'

type TabKey = 'meusDados' | 'privacidade' | 'suporte'

interface ConfiguracoesTabsProps {
  meusDadosLabel: string
  privacidadeLabel: string
  suporteLabel: string
  meusDados: React.ReactNode
  privacidade: React.ReactNode
  suporte: React.ReactNode
  /** Rótulo do grupo de abas para leitores de tela (ex.: "Configurações"). */
  groupAriaLabel?: string
}

/** Abas de `/configuracoes` (feature 024, ajuste de UX pós-implementação) — mesmo `Segmented`
 * usado no resto do produto (Espelho, Registros), pra não introduzir mais um padrão de navegação. */
export function ConfiguracoesTabs({
  meusDadosLabel,
  privacidadeLabel,
  suporteLabel,
  meusDados,
  privacidade,
  suporte,
  groupAriaLabel = 'Configurações',
}: ConfiguracoesTabsProps) {
  const [active, setActive] = useState<TabKey>('meusDados')

  const panels: Record<TabKey, React.ReactNode> = { meusDados, privacidade, suporte }

  return (
    <div className="flex flex-col gap-6">
      <Segmented
        ariaLabel={groupAriaLabel}
        items={[
          { key: 'meusDados', label: meusDadosLabel, active: active === 'meusDados', onClick: () => setActive('meusDados') },
          { key: 'privacidade', label: privacidadeLabel, active: active === 'privacidade', onClick: () => setActive('privacidade') },
          { key: 'suporte', label: suporteLabel, active: active === 'suporte', onClick: () => setActive('suporte') },
        ]}
      />

      {panels[active]}
    </div>
  )
}
