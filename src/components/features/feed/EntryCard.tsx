'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslations } from 'next-intl'
import { Trash2, Pencil, Check, X, ChevronDown, ChevronUp, Paperclip, Sparkles } from 'lucide-react'
import type { FeedItem } from '@/lib/feed/types'
import type { EntrySource } from '@/types/entry'
import { UsarButton } from '@/components/features/content/UsarButton'
import { AttachTile } from '@/components/features/capture/AttachTile'
import { ContextPillPicker } from './ContextPillPicker'
import { deriveContextStatus } from '@/lib/entries/contextStatus'

interface EntryCardProps {
  item: FeedItem
  variant: 'feed' | 'panel'
  onDelete?: (id: string) => void
  onEdit?: (id: string, what_i_did: string) => void
  /** Vocabulário de contextos da pessoa (Story 2) — empresas já usadas, alimenta o `ContextPillPicker`. */
  contextVocabulary?: string[]
  /** Notifica o pai da nova seleção de contexto, após o `PATCH` confirmar sucesso. */
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

export function EntryCard({ item, variant, onDelete, onEdit, contextVocabulary = [], onContextChange }: EntryCardProps) {
  const t = useTranslations('feed')
  const tRegistro = useTranslations('registro')
  const [expanded, setExpanded] = useState(false)
  // Story 2 (FR-008): sinalização discreta de "contexto não identificado" no header do card —
  // nunca um badge de erro/alerta, um convite a completar (ux-shape.md §6).
  const contextStatus = deriveContextStatus(item.company, item.is_personal_project)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.what_i_did)
  const [saving, setSaving] = useState(false)
  // US1 (feature 026): "Organizar" é opcional e local ao card — sem popup em falha (FR-030), sem
  // rótulo persistente além de "Organizar de novo" no sucesso (ux-shape.md §6).
  const [organizeState, setOrganizeState] = useState<OrganizeButtonState>('idle')

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
   * (FR-030) — permitindo nova tentativa clicando "Organizar" de novo.
   */
  async function handleOrganize() {
    setOrganizeState('organizing')
    try {
      const res = await fetch(`/api/entries/${item.id}/organize`, { method: 'POST' })
      const body = (await res.json().catch(() => null)) as { status?: string } | null
      setOrganizeState(res.ok && body?.status === 'organized' ? 'done' : 'idle')
    } catch {
      setOrganizeState('idle')
    }
  }

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
        <span aria-hidden="true" className="mt-0.5 shrink-0">{SOURCE_ICON[item.source]}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-medium text-sm leading-snug">
            {item.title}
          </span>
          <span className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
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
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              {editValue}
            </p>
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

          <div className="flex items-center gap-2 flex-wrap">
            <UsarButton
              seedType="entry"
              seedRef={item.id}
              seedSummary={editValue}
              formats={['post', 'impact_summary']}
            />

            {variant === 'feed' && !editing && (
              <button
                type="button"
                onClick={() => void handleOrganize()}
                disabled={organizeState === 'organizing'}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 min-h-[48px] rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <Sparkles size={12} aria-hidden="true" />
                {organizeState === 'organizing'
                  ? tRegistro('organize.organizing')
                  : organizeState === 'done'
                    ? tRegistro('organize.ctaAgain')
                    : tRegistro('organize.cta')}
              </button>
            )}

            {variant === 'feed' && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 min-h-[48px] rounded-full transition-opacity hover:opacity-80"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <Pencil size={12} aria-hidden="true" />
                {t('card.edit')}
              </button>
            )}

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
