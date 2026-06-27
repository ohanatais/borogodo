import { Home, Sparkles, LayoutList, Compass, type LucideIcon } from 'lucide-react'

/**
 * Modelo de navegação de topo (021): o menu expressa a espinha — 4 destinos, não 6.
 * Configuração estática (não vem do banco). Ver specs/021-navegacao-espinha/data-model.md.
 */
export interface NavDestino {
  id: 'painel' | 'espelho' | 'registros' | 'usar'
  labelKey: string
  icon: LucideIcon
  path: string
  /** Prefixos de pathname que acendem o destino. */
  activePrefixes: string[]
}

export const NAV_DESTINOS: NavDestino[] = [
  { id: 'painel',    labelKey: 'appNav.painel',    icon: Home,       path: '/painel',    activePrefixes: ['/painel'] },
  { id: 'espelho',   labelKey: 'appNav.espelho',   icon: Sparkles,   path: '/espelho',   activePrefixes: ['/espelho'] },
  { id: 'registros', labelKey: 'appNav.registros', icon: LayoutList, path: '/registros', activePrefixes: ['/registros'] },
  // "Usar" abre o splash de intenção (/usar); cada caminho leva a um hub ESCOPADO do Repertório
  // (/presenca?hub=). /presenca e /autoavaliacao acendem o mesmo destino.
  { id: 'usar',      labelKey: 'appNav.usar',      icon: Compass,    path: '/usar',      activePrefixes: ['/usar', '/presenca', '/autoavaliacao'] },
]

/** Um destino está ativo quando algum dos seus prefixos é prefixo do pathname. */
export function isActive(destino: NavDestino, pathname: string): boolean {
  return destino.activePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
