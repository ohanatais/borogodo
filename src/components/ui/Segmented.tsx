import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Controle segmentado padrão do sistema (021): pill arredondado, item ativo em roxo preenchido,
 * inativos em cinza. UM componente pra todos os toggles de 2+ opções — Espelho (Forças/Trajetória),
 * Registros (Quando anotei/aconteceu), barra (Registrar/Perguntar) — pra não divergirem de estilo.
 *
 * Cada item é link (vista vive na URL) OU botão (estado local). `size` ajusta só a densidade; a
 * linguagem visual é idêntica em todo lugar.
 */
export interface SegmentedItem {
  key: string
  label: ReactNode
  active: boolean
  /** Link (a vista vive na URL). Mutuamente exclusivo com onClick. */
  href?: string
  /** Botão (estado local). */
  onClick?: () => void
  ariaLabel?: string
}

interface SegmentedProps {
  items: SegmentedItem[]
  ariaLabel: string
  /** 'md' = toggles de página (padrão); 'sm' = inline denso (ex.: barra de captura). */
  size?: 'sm' | 'md'
}

const SIZE: Record<'sm' | 'md', string> = {
  sm: 'text-xs px-3 min-h-9',
  md: 'text-sm px-4 min-h-11',
}

export function Segmented({ items, ariaLabel, size = 'md' }: SegmentedProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center p-0.5 rounded-full"
      // Token de superfície (não o literal branco fixo): sobrevive ao dark mode (US6, 025) — em
      // vez de ficar branco puro sobre fundo escuro, acompanha --muted (já tem par claro/escuro).
      style={{ background: 'var(--muted)' }}
    >
      {items.map((item) => {
        const className = `${SIZE[size]} rounded-full flex items-center justify-center transition-[background-color,color] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none`
        const style = {
          background: item.active ? 'var(--color-primary)' : 'transparent',
          color: item.active ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
          fontWeight: item.active ? 600 : 400,
          outlineColor: 'var(--color-primary)',
        } as const

        return item.href ? (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            aria-label={item.ariaLabel}
            className={className}
            style={style}
          >
            {item.label}
          </Link>
        ) : (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            aria-pressed={item.active}
            aria-label={item.ariaLabel}
            className={className}
            style={style}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
