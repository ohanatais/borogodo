'use client'

import { PenLine } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { dispatchOpenDrawer } from '@/components/features/painel/registroTriggerEvents'
import { Button } from '@/components/ui/button'

interface RegistrarButtonProps {
  /** Classe Tailwind de altura — pra bater com o resto da fileira de filtros quando embutido ali
   * (`h-[44px]`); sozinho, usa a altura maior padrão de CTA (`h-[54px]`). */
  height?: string
}

/**
 * Botão "Registrar" só de Registros — usa o primário roxo do sistema. O `RegistroTrigger` do
 * Painel continua como campo de captura em coral, pois ali ele é o foco da página. Digitar
 * ou colar direto no `RegistroTrigger` já abre o Drawer de qualquer forma (nenhuma tecla fica
 * "presa" nele) — então um botão puro não perde nenhum atalho real, só troca a aparência por algo
 * com mais peso visual. Ainda isolado aqui: só migra pro Painel também se o visual se confirmar.
 */
export function RegistrarButton({ height = 'h-[54px]' }: RegistrarButtonProps) {
  const t = useTranslations('feed')

  return (
    <Button
      type="button"
      onClick={() => dispatchOpenDrawer({})}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors hover:opacity-90 ${height}`}
    >
      <PenLine size={18} aria-hidden="true" />
      {t('composer.registerButton')}
    </Button>
  )
}
