// Contrato do evento que abre o Drawer de Registro a partir do Painel (025-registro-deposito,
// US5) ou de Registros, para editar uma fonte existente (026-organizar-destaques, Editar).
// Módulo sem JSX para o gatilho (`RegistroTrigger`/`SourceCard`) e o shell (`AppShellClient`,
// dono do `Drawer`) compartilharem o tipo sem se importar diretamente — mesmo padrão de
// `presencaEvents.ts`.

import type { DrawerManualFields } from '@/hooks/useDrawerDraft'
import type { FeedHighlight } from '@/lib/feed/types'

export const OPEN_DRAWER_EVENT = 'borogodo:open-drawer'

export interface EditEntryDetail {
  id: string
  rawText: string
  manualFields?: Partial<DrawerManualFields>
  /** `true` quando a fonte tem 2+ destaques reais (revisão pós-implementação, 026) — nesse caso
   * o Drawer esconde Métrica/Impacto (representam 1 destaque só) e mostra, no lugar, a lista dos
   * destaques atuais (só leitura) + "Organizar de novo" — a única forma de corrigir o conteúdo é
   * editar o texto cru e reorganizar, que substitui todos os destaques de uma vez. */
  isMultiHighlight?: boolean
  /** Destaques atuais da fonte — alimenta a lista só-leitura mostrada no Drawer quando
   * `isMultiHighlight`. */
  highlights?: FeedHighlight[]
}

export interface OpenDrawerDetail {
  /** Preenchido quando a pessoa já digitou/colou algo no gatilho antes do drawer abrir (FR-012a). */
  initialText?: string
  /** Quando presente, o Drawer abre em modo edição de uma fonte já salva (Registros → Editar):
   * pré-preenche texto cru + campos manuais, e o salvar vira `PATCH` em vez de criar um registro novo. */
  editEntry?: EditEntryDetail
}

/** Abre o Drawer de Registro, opcionalmente já com um texto inicial (FR-012a). */
export function dispatchOpenDrawer(detail: OpenDrawerDetail = {}): void {
  window.dispatchEvent(new CustomEvent(OPEN_DRAWER_EVENT, { detail }))
}

// Notifica quem estiver com um `SourceCard` montado (ex. Registros) de que a fonte foi editada
// via Drawer — o `Drawer` vive no shell, fora da árvore de Registros, então o `router.refresh()`
// sozinho não resincroniza o estado local otimista do feed.
export const ENTRY_UPDATED_EVENT = 'borogodo:entry-updated'

export interface EntryUpdatedDetail {
  id: string
  what_i_did: string
  metric?: string
  impact?: string
  company?: string
  entryDate?: string
}

export function dispatchEntryUpdated(detail: EntryUpdatedDetail): void {
  window.dispatchEvent(new CustomEvent(ENTRY_UPDATED_EVENT, { detail }))
}

// "Organizar de novo" disparado de DENTRO do Drawer (edição de fonte com 2+ destaques) — mesmo
// motivo do evento acima: o Drawer vive fora da árvore de Registros, então precisa notificar o
// card pra substituir seus destaques localmente sem esperar um reload de página inteira.
export const ENTRY_HIGHLIGHTS_UPDATED_EVENT = 'borogodo:entry-highlights-updated'

export interface EntryHighlightsUpdatedDetail {
  id: string
  highlights: FeedHighlight[]
}

export function dispatchEntryHighlightsUpdated(detail: EntryHighlightsUpdatedDetail): void {
  window.dispatchEvent(new CustomEvent(ENTRY_HIGHLIGHTS_UPDATED_EVENT, { detail }))
}
