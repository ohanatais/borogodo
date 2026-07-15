'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslations } from 'next-intl'
import { Trash2, Pencil, Check, X, ChevronDown, ChevronUp, Paperclip, Sparkles, Plus } from 'lucide-react'
import type { FeedHighlight, FeedItem } from '@/lib/feed/types'
import type { EntrySource } from '@/types/entry'
import { UsarButton } from '@/components/features/content/UsarButton'
import { AttachTile } from '@/components/features/capture/AttachTile'
import { ContextPillPicker } from './ContextPillPicker'
import { HighlightCard } from './HighlightCard'
import { deriveContextStatus } from '@/lib/entries/contextStatus'
import { deriveOrganizationStatus } from '@/lib/entries/organizationStatus'

interface SourceCardProps {
  item: FeedItem
  variant: 'feed' | 'panel'
  onDelete?: (id: string) => void
  onEdit?: (id: string, what_i_did: string) => void
  /** Vocabulário de contextos da pessoa (Story 2) — empresas já usadas, alimenta o `ContextPillPicker`. */
  contextVocabulary?: string[]
  /** Notifica o pai da nova seleção de contexto, após o `PATCH` (ou o "Organizar") confirmar sucesso. */
  onContextChange?: (id: string, next: { company: string | null; isPersonalProject: boolean }) => void
}

const SOURCE_ICON: Record<EntrySource, string> = {
  text: '📝',
  chips: '📝',
  audio: '🎙️',
  linkedin_pdf: '📄',
  image: '🖼️',
  // 025-registro-deposito: mesmo texto cru do drawer, ícone igual ao das demais entradas de texto.
  deposito: '📝',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type OrganizeButtonState = 'idle' | 'organizing' | 'done'

interface OrganizeResponseBody {
  status?: string
  highlights?: FeedHighlight[]
  company?: string | null
  is_personal_project?: boolean
}

/**
 * Card de uma FONTE no feed de Registros (US7, feature 026) — 1 card por fonte, nunca por
 * destaque (FR-025). Consolida o que antes vivia espalhado como `EntryCard`: os destaques agora
 * chegam prontos em `item.highlights` (join feito em `getFeedData`, ver `contracts/feed.md`) —
 * não há mais fetch lazy por card ao expandir.
 */
export function SourceCard({ item, variant, onDelete, onEdit, contextVocabulary = [], onContextChange }: SourceCardProps) {
  const t = useTranslations('feed')
  const tRegistro = useTranslations('registro')
  const [expanded, setExpanded] = useState(false)
  // Story 2 (FR-008): sinalização discreta de "contexto não identificado" no header do card —
  // nunca um badge de erro/alerta, um convite a completar (ux-shape.md §6).
  const contextStatus = deriveContextStatus(item.company, item.is_personal_project)
  // US3 (feature 026): fonte da verdade do servidor para "organizando…" — cobre tanto o disparo
  // assíncrono (salvar sem clicar em Organizar) quanto uma organização manual iniciada em outra
  // aba/sessão. Derivado ao vivo (não de `item.organizationStatus`, que `getFeedData` também
  // calcula): uma organização travada além do timeout (FR-030) precisa se autocorrigir no
  // cliente sem esperar um novo carregamento do feed — um valor congelado no momento do SSR não
  // se autocorrigiria.
  const serverOrganizationStatus = deriveOrganizationStatus(item.organized_at, item.organizing_started_at)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.what_i_did)
  const [saving, setSaving] = useState(false)
  const [sourceExpanded, setSourceExpanded] = useState(false)
  // US1 (feature 026): "Organizar" é opcional e local ao card — sem popup em falha (FR-030), sem
  // rótulo persistente além de "Organizar de novo" no sucesso (ux-shape.md §6).
  const [organizeState, setOrganizeState] = useState<OrganizeButtonState>('idle')
  // US7 (feature 026): destaques da fonte já vêm prontos em `item.highlights` (sem fetch lazy) —
  // este estado local existe só para refletir CRUD otimista (adicionar/editar/remover destaque,
  // e os destaques novos que "Organizar" insere) sem esperar um novo carregamento do feed.
  const [highlights, setHighlights] = useState<FeedHighlight[]>(item.highlights)

  function handleHighlightUpdate(updated: FeedHighlight) {
    setHighlights((current) => current.map((h) => (h.id === updated.id ? updated : h)))
  }

  function handleHighlightDelete(highlightId: string) {
    setHighlights((current) => current.filter((h) => h.id !== highlightId))
  }

  /**
   * "+ adicionar destaque" (FR-016) — cria um destaque em branco independente de a organização
   * por IA já ter rodado; entra na lista já aberto (a pessoa acabou de pedir para criar).
   */
  async function handleAddHighlight() {
    try {
      const res = await fetch(`/api/entries/${item.id}/highlights`, { method: 'POST' })
      const body = (await res.json().catch(() => null)) as { highlight?: FeedHighlight } | null
      if (res.ok && body?.highlight) {
        setHighlights((current) => [...current, body.highlight as FeedHighlight])
      }
    } catch {
      // silencioso — mesmo padrão de falha não bloqueante do restante do card (ux-shape.md §7).
    }
  }

  const displayDate = item.entry_date ?? item.created_at
  const dateLabel = formatDate(displayDate)

  function handleConfirmDelete() {
    setDeleteOpen(false)
    onDelete?.(item.id)
  }

  async function handleSaveEdit() {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === item.what_i_did) { setEditing(false); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/entries/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ what_i_did: trimmed }),
      })
      if (res.ok) {
        onEdit?.(item.id, trimmed)
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    setEditValue(item.what_i_did)
    setEditing(false)
  }

  /**
   * Dispara "Organizar" (POST /api/entries/[id]/organize, US1). Guarda de duplo clique local:
   * o botão fica `disabled` assim que `organizeState` vira 'organizing' (ux-shape.md §7).
   * Falha de IA (status: 'failed') ou de rede volta ao estado inicial silenciosamente — sem popup
   * (FR-030) — permitindo nova tentativa clicando "Organizar" de novo. Os destaques inseridos e
   * o contexto resolvido pela IA (quando ainda vazio, FR-002/FR-006) são mesclados localmente —
   * sem isso, eles só apareceriam depois de um novo carregamento da página.
   */
  async function handleOrganize() {
    // Idempotência (FR-031): se a organização assíncrona já está em andamento, o clique manual
    // não dispara uma segunda chamada de rede — o botão já nasce desabilitado nesse caso, este
    // guard cobre o caso defensivo de um clique disparado por outro meio (ex. Enter no foco).
    if (serverOrganizationStatus === 'organizing') return
    setOrganizeState('organizing')
    try {
      const res = await fetch(`/api/entries/${item.id}/organize`, { method: 'POST' })
      const body = (await res.json().catch(() => null)) as OrganizeResponseBody | null
      if (res.ok && body?.status === 'organized') {
        setOrganizeState('done')
        if (body.highlights?.length) {
          // FR-032: uma fonte nunca organizada mostra um destaque SINTÉTICO (id === item.id, ver
          // `getFeedData.syntheticHighlight`) representando os campos legados — ele não tem linha
          // própria em `entry_highlights`. Ao organizar com sucesso, os destaques reais retornados
          // substituem esse placeholder (senão ele ficaria "fantasma" na lista, duplicando o
          // título antigo ao lado dos destaques novos). Uma fonte já organizada não tem esse
          // placeholder (todo highlight ali já é real), então o filtro não remove nada — os novos
          // destaques só se somam aos existentes (FR-014, "organizar" nunca sobrescreve).
          setHighlights((current) => [
            ...current.filter((h) => h.id !== item.id),
            ...(body.highlights as FeedHighlight[]),
          ])
        }
        if (variant === 'feed' && (body.company !== undefined || body.is_personal_project !== undefined)) {
          onContextChange?.(item.id, {
            company: body.company ?? null,
            isPersonalProject: body.is_personal_project ?? false,
          })
        }
      } else {
        setOrganizeState('idle')
      }
    } catch {
      setOrganizeState('idle')
    }
  }

  const highlightsCount = highlights.length

  return (
    <li id={`registro-${item.id}`} className="scroll-mt-24 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? t('card.collapse') : t('card.expand')}
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left min-h-[48px] transition-opacity hover:opacity-80"
        style={{ color: 'var(--foreground)' }}
      >
        {/* FR-027: miniatura real da imagem anexada quando existir, nunca um ícone genérico por tipo. */}
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura remota (bucket Supabase), não otimizável por next/image sem domínio fixo por ambiente
          <img
            src={item.thumbnail}
            alt=""
            aria-hidden="true"
            className="mt-0.5 shrink-0 rounded-md object-cover"
            style={{ width: 32, height: 32 }}
          />
        ) : (
          <span aria-hidden="true" className="mt-0.5 shrink-0">{SOURCE_ICON[item.source]}</span>
        )}
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="block font-display font-semibold text-[15px] leading-snug">
              {item.title}
            </span>
            {/* FR-025: selo de contagem só quando há mais de 1 destaque — com exatamente 1, FR-017
                já resolve isso (destaque único vem sempre aberto, sem necessidade de sinalizar). */}
            {highlightsCount > 1 && (
              <span
                className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-lilas-nevoa-text)' }}
              >
                {t('card.highlightsBadge', { count: highlightsCount })}
              </span>
            )}
          </span>
          <span className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {item.metric && (
              <span className="font-medium" style={{ color: 'var(--color-accent-text)' }}>
                {item.metric}
              </span>
            )}
            <span>{dateLabel}</span>
            {item.is_personal_project ? (
              <span>· {tRegistro('context.personalProjectLabel')}</span>
            ) : (
              item.company && <span>· {item.company}</span>
            )}
            {contextStatus === 'unresolved' && (
              <span className="inline-flex items-center gap-1 italic" style={{ color: 'var(--muted-foreground)' }}>
                <span aria-hidden="true">·</span>
                <span>{tRegistro('context.unresolvedLabel')}</span>
              </span>
            )}
            {serverOrganizationStatus === 'organizing' && (
              <span className="inline-flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                <span aria-hidden="true">·</span>
                <span>{tRegistro('organize.organizing')}</span>
              </span>
            )}
          </span>
        </span>
        <span className="shrink-0 mt-0.5" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={Math.max(3, editValue.split('\n').length + 1)}
                autoFocus
                className="text-sm leading-relaxed rounded-lg p-2 border resize-y w-full"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveEdit()}
                  disabled={saving}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 min-h-[44px] rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                >
                  <Check size={12} aria-hidden="true" />
                  {saving ? '…' : t('card.save')}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 min-h-[44px] rounded-full transition-opacity hover:opacity-80"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  <X size={12} aria-hidden="true" />
                  {t('card.cancelEdit')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {(item.organized_at || variant === 'feed') && (
                <div className="flex items-center gap-3 pt-1" style={{ borderTop: '1px solid color-mix(in oklch, var(--border) 60%, transparent)' }}>
                  {/* Selo "Organizado pelo Borogodó" só quando a IA de fato organizou esta fonte
                      (item.organized_at) — destaques só criados manualmente ("+ adicionar destaque")
                      não ganham o selo, sem precisar de um campo novo no banco para distinguir. */}
                  {item.organized_at ? (
                    <span
                      className="inline-flex items-center gap-1.5 flex-1 min-w-0 text-xs font-medium"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      <Sparkles size={12} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
                      {tRegistro('organizedBy')}
                    </span>
                  ) : (
                    <span className="flex-1" />
                  )}
                  {variant === 'feed' && !editing && (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 min-h-[44px] rounded-full border shrink-0 transition-opacity hover:opacity-80"
                      style={{ color: 'var(--color-primary)', borderColor: 'var(--border)' }}
                    >
                      <Pencil size={12} aria-hidden="true" />
                      {t('card.edit')}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {variant === 'feed' && (
            <ContextPillPicker
              entryId={item.id}
              company={item.company}
              isPersonalProject={item.is_personal_project}
              vocabulary={contextVocabulary}
              onChange={(next) => onContextChange?.(item.id, next)}
            />
          )}

          {variant === 'feed' && highlights.length > 0 && (
            <div className="flex flex-col gap-2">
              {highlights.map((highlight, index) => (
                <HighlightCard
                  key={highlight.id}
                  entryId={item.id}
                  highlight={highlight}
                  index={index + 1}
                  defaultOpen={highlights.length === 1}
                  onUpdate={handleHighlightUpdate}
                  onDelete={handleHighlightDelete}
                />
              ))}
            </div>
          )}

          {variant === 'feed' && (
            <button
              type="button"
              onClick={() => void handleAddHighlight()}
              className="inline-flex items-center justify-center gap-1 self-start text-xs font-medium px-3 py-1.5 min-h-[48px] rounded-full border border-dashed transition-opacity hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              <Plus size={12} aria-hidden="true" />
              {tRegistro('highlight.addNew')}
            </button>
          )}

          {item.evidences.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.evidences.map((evidence, index) => (
                <AttachTile
                  key={`${evidence.type}-${evidence.value}-${index}`}
                  kind={evidence.type === 'image' ? 'image' : 'link'}
                  previewUrl={evidence.value}
                  label={evidence.label}
                />
              ))}
            </div>
          )}

          {item.source === 'linkedin_pdf' && item.file_name && (
            <span
              className="inline-flex items-center gap-1.5 self-start text-xs px-2 py-0.5 rounded-full max-w-full"
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              title={item.file_name}
            >
              <Paperclip size={12} aria-hidden="true" className="shrink-0" />
              <span className="truncate">{item.file_name}</span>
            </span>
          )}

          {!editing && (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setSourceExpanded((v) => !v)}
                className="self-start text-xs font-medium min-h-[44px] transition-opacity hover:opacity-80"
                style={{ color: 'var(--color-primary)' }}
              >
                {sourceExpanded ? t('card.hideFull') : t('card.viewFull')}
              </button>
              {sourceExpanded && (
                <p
                  className="text-sm leading-relaxed overflow-y-auto rounded-lg border p-3"
                  style={{
                    color: 'var(--muted-foreground)',
                    whiteSpace: 'pre-wrap',
                    maxHeight: 280,
                    borderColor: 'var(--border)',
                    background: 'var(--muted)',
                  }}
                >
                  {editValue}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <UsarButton
              seedType="entry"
              seedRef={item.id}
              seedSummary={editValue}
              formats={['post', 'impact_summary']}
            />

            {variant === 'feed' && !editing && (() => {
              // US3: o botão reflete tanto o clique manual local (`organizeState`) quanto a
              // organização assíncrona em andamento no servidor (`serverOrganizationStatus`) —
              // qualquer um dos dois basta para mostrar "organizando…" e desabilitar (FR-031).
              const isOrganizingNow = organizeState === 'organizing' || serverOrganizationStatus === 'organizing'
              const isOrganizedAlready = organizeState === 'done' || serverOrganizationStatus === 'organized'
              return (
                <button
                  type="button"
                  onClick={() => void handleOrganize()}
                  disabled={isOrganizingNow}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 min-h-[48px] rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <Sparkles size={12} aria-hidden="true" />
                  {isOrganizingNow
                    ? tRegistro('organize.organizing')
                    : isOrganizedAlready
                      ? tRegistro('organize.ctaAgain')
                      : tRegistro('organize.cta')}
                </button>
              )
            })()}

            {variant === 'feed' && onDelete && !editing && (
              <button
                type="button"
                aria-label={t('card.delete')}
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 min-h-[48px] rounded-full transition-opacity hover:opacity-80"
                style={{ color: 'var(--destructive)' }}
              >
                <Trash2 size={12} aria-hidden="true" />
                {t('card.delete')}
              </button>
            )}
          </div>
        </div>
      )}

      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            className="fixed inset-0 z-40"
            style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(2px)' }}
          />
          <Dialog.Content
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,380px)] rounded-2xl p-6 flex flex-col gap-5 focus:outline-none"
            style={{ background: 'var(--color-creme)', boxShadow: 'var(--shadow-modal)' }}
          >
            <div className="flex flex-col gap-1.5">
              <Dialog.Title className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                {t('card.deleteConfirm.title')}
              </Dialog.Title>
              <Dialog.Description className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('card.deleteConfirm.description')}
              </Dialog.Description>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-sm font-medium px-4 py-2 min-h-[48px] rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  {t('card.deleteConfirm.cancel')}
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center justify-center text-sm font-medium px-4 py-2 min-h-[48px] rounded-lg transition-opacity hover:opacity-90"
                style={{ background: 'var(--destructive)', color: 'var(--color-primary-fg)' }}
              >
                {t('card.deleteConfirm.confirm')}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </li>
  )
}
