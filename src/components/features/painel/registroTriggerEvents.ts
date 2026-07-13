// Contrato do evento que abre o Drawer de Registro a partir do Painel (025-registro-deposito,
// US5). Módulo sem JSX para o gatilho (`RegistroTrigger`) e o shell (`AppShellClient`, dono do
// `Drawer`) compartilharem o tipo sem se importar diretamente — mesmo padrão de
// `presencaEvents.ts`.

export const OPEN_DRAWER_EVENT = 'borogodo:open-drawer'

export interface OpenDrawerDetail {
  /** Preenchido quando a pessoa já digitou/colou algo no gatilho antes do drawer abrir (FR-012a). */
  initialText?: string
}

/** Abre o Drawer de Registro, opcionalmente já com um texto inicial (FR-012a). */
export function dispatchOpenDrawer(detail: OpenDrawerDetail = {}): void {
  window.dispatchEvent(new CustomEvent(OPEN_DRAWER_EVENT, { detail }))
}
