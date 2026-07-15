import {
  Home,
  Sparkles,
  LayoutList,
  Compass,
  PenLine,
  TrendingUp,
  Megaphone,
  Target,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'

/**
 * Modelo de navegação de topo (021): o menu expressa a espinha — 4 destinos, não 6.
 * Configuração estática (não vem do banco). Ver specs/021-navegacao-espinha/data-model.md.
 *
 * A tab bar mobile (FR-025) continua consumindo esta lista plana, mesmo depois de a sidebar
 * desktop passar a agrupar (ver `NAV_GROUPS` abaixo, 025-registro-deposito).
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
export function isActive(destino: { activePrefixes: string[] }, pathname: string): boolean {
  return destino.activePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

// ─── Navegação em grupos (sidebar desktop, 025-registro-deposito) ─────────────────────────────

/**
 * Item de navegação que é um link real (RSC navega). `activeQuery` desambigua itens que
 * compartilham o mesmo `activePrefixes` (ex.: Perfil/Trajetória em `/espelho`, Gerar
 * conteúdo/Me preparar em `/presenca`) — sem isso, os dois acenderiam juntos.
 */
export interface NavLink {
  kind: 'link'
  id: string
  labelKey: string
  icon: LucideIcon
  path: string
  activePrefixes: string[]
  activeQuery?: { key: string; value: string; defaultValue?: string }
}

/** Item de navegação que dispara uma ação local (abrir o Drawer, abrir o ChatSheet) — não navega. */
export interface NavAction {
  kind: 'action'
  id: string
  labelKey: string
  icon: LucideIcon
  action: 'open-drawer' | 'open-chat'
}

export type NavGroupItem = NavLink | NavAction

export interface NavGroup {
  id: string
  /** Ausente para o grupo do topo (Painel/Registrar) — sem header visível. */
  labelKey?: string
  items: NavGroupItem[]
}

/**
 * Grupos da sidebar desktop (025): Painel + Registrar isolados no topo, depois "Meu espelho"
 * (Perfil/Trajetória/Registros) e "Usar" (Gerar conteúdo/Me preparar/Perguntar). A tab bar
 * mobile NÃO usa esta estrutura — continua em `NAV_DESTINOS` (FR-025).
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'topo',
    items: [
      { kind: 'link', id: 'painel', labelKey: 'appNav.painel', icon: Home, path: '/painel', activePrefixes: ['/painel'] },
      { kind: 'action', id: 'registrar', labelKey: 'appNav.registrar', icon: PenLine, action: 'open-drawer' },
    ],
  },
  {
    id: 'meuEspelho',
    labelKey: 'appNav.groups.meuEspelho',
    items: [
      {
        kind: 'link',
        id: 'perfil',
        labelKey: 'appNav.perfil',
        icon: Sparkles,
        path: '/espelho',
        activePrefixes: ['/espelho'],
        activeQuery: { key: 'vista', value: 'forcas', defaultValue: 'forcas' },
      },
      {
        kind: 'link',
        id: 'trajetoria',
        labelKey: 'appNav.trajetoria',
        icon: TrendingUp,
        path: '/espelho?vista=trajetoria',
        activePrefixes: ['/espelho'],
        activeQuery: { key: 'vista', value: 'trajetoria', defaultValue: 'forcas' },
      },
      { kind: 'link', id: 'registros', labelKey: 'appNav.registros', icon: LayoutList, path: '/registros', activePrefixes: ['/registros'] },
    ],
  },
  {
    id: 'usar',
    labelKey: 'appNav.groups.usar',
    items: [
      {
        kind: 'link',
        id: 'gerarConteudo',
        labelKey: 'appNav.gerarConteudo',
        icon: Megaphone,
        path: '/presenca?hub=mostrar',
        activePrefixes: ['/presenca'],
        activeQuery: { key: 'hub', value: 'mostrar' },
      },
      {
        kind: 'link',
        id: 'mePreparar',
        labelKey: 'appNav.mePreparar',
        icon: Target,
        path: '/presenca?hub=preparar',
        activePrefixes: ['/presenca'],
        activeQuery: { key: 'hub', value: 'preparar' },
      },
      { kind: 'action', id: 'perguntar', labelKey: 'appNav.perguntar', icon: MessageCircle, action: 'open-chat' },
    ],
  },
]

/**
 * Um `NavGroupItem` está ativo quando é um link, o pathname casa `activePrefixes`, e (se houver
 * `activeQuery`) o valor atual do parâmetro de busca casa `activeQuery.value` — usando
 * `defaultValue` quando o parâmetro está ausente da URL (ex.: `/espelho` sem `?vista` = Perfil).
 */
export function isGroupItemActive(
  item: NavGroupItem,
  pathname: string,
  searchParams: URLSearchParams
): boolean {
  if (item.kind !== 'link') return false
  if (!isActive(item, pathname)) return false
  if (!item.activeQuery) return true

  const current = searchParams.get(item.activeQuery.key) ?? item.activeQuery.defaultValue ?? ''
  return current === item.activeQuery.value
}
