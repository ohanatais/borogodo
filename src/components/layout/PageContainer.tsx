import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  /** Overrides pontuais (ex.: padding inferior extra pra limpar o FAB mobile). */
  className?: string
}

/**
 * Largura/padding padrão das páginas internas do app (mesmo contêiner de `/espelho`) —
 * `px-5 lg:px-9`, `max-w-[980px]`. Existia sem componente compartilhado antes: cada página
 * reinventava a própria classe, e isso "quebrava" a cada feature nova (Painel chegou a divergir
 * do próprio skeleton de loading). Usar este componente em vez de reescrever a classe.
 */
export function PageContainer({ children, className = '' }: PageContainerProps) {
  return <div className={`px-5 lg:px-9 pt-6 max-w-[980px] mx-auto w-full ${className}`}>{children}</div>
}
