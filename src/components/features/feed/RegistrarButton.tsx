'use client'

import { PenLine } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { dispatchOpenDrawer } from '@/components/features/painel/registroTriggerEvents'

interface RegistrarButtonProps {
  /** Classe Tailwind de altura — pra bater com o resto da fileira de filtros quando embutido ali
   * (`h-[44px]`); sozinho, usa a altura maior padrão de CTA (`h-[54px]`). */
  height?: string
}

/**
 * Botão "Registrar" só de Registros (revisão de UX pós-implementação, 026) — versão sólida coral,
 * distinta do `RegistroTrigger` do Painel (contorno fino, disfarçado de campo de texto). Digitar
 * ou colar direto no `RegistroTrigger` já abre o Drawer de qualquer forma (nenhuma tecla fica
 * "presa" nele) — então um botão puro não perde nenhum atalho real, só troca a aparência por algo
 * com mais peso visual. Ainda isolado aqui: só migra pro Painel também se o visual se confirmar.
 */
export function RegistrarButton({ height = 'h-[54px]' }: RegistrarButtonProps) {
  const t = useTranslations('feed')

  return (
    <button
      type="button"
      onClick={() => dispatchOpenDrawer({})}
      className={`inline-flex items-center gap-2 shrink-0 rounded-full px-5 text-sm font-semibold transition-opacity hover:opacity-90 ${height}`}
      style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
    >
      <PenLine size={18} aria-hidden="true" />
      {t('composer.registerButton')}
    </button>
  )
}
