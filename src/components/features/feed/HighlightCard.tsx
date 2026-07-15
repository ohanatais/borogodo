'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslations } from 'next-intl'
import { Check, X, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import type { EntryHighlight } from '@/types/entry'

interface HighlightCardProps {
  entryId: string
  highlight: EntryHighlight
  /** Aberto por padrão quando é o único destaque da fonte (FR-017) — decidido pelo pai (contagem). */
  defaultOpen: boolean
  /** Notifica o pai do destaque atualizado (isolado — nunca os demais, FR-015). */
  onUpdate: (updated: EntryHighlight) => void
  /** Notifica o pai da remoção deste destaque (isolado — nunca a fonte nem os demais, FR-015). */
  onDelete: (highlightId: string) => void
}

interface HighlightFormValues {
  title: string
  metric: string
  impact: string
  tags: string
}

function toFormValues(highlight: EntryHighlight): HighlightFormValues {
  return {
    title: highlight.title ?? '',
    metric: highlight.metric ?? '',
    impact: highlight.impact ?? '',
    tags: highlight.tags.join(', '),
  }
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

const inputStyle = { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' } as const

/**
 * Um destaque dentro de uma fonte (US4, feature 026) — título/métrica/impacto/tags editáveis e
 * removíveis de forma isolada por linha de `entry_highlights` (FR-015): cada PATCH/DELETE afeta
 * só este destaque, nunca os demais nem a fonte. Aberto por padrão quando é o único destaque da
 * fonte (FR-017, decidido pelo pai via `defaultOpen`); ausência de métrica é válida, nunca
 * tratada como erro (FR-018) — o campo simplesmente não aparece.
 */
export function HighlightCard({ entryId, highlight, defaultOpen, onUpdate, onDelete }: HighlightCardProps) {
  const t = useTranslations('registro')
  const [expanded, setExpanded] = useState(defaultOpen)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<HighlightFormValues>(() => toFormValues(highlight))
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const summaryTitle = highlight.title || t('highlight.untitled')

  function startEditing() {
    setForm(toFormValues(highlight))
    setEditing(true)
    setExpanded(true)
  }

  function cancelEditing() {
    setForm(toFormValues(highlight))
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/entries/${entryId}/highlights/${highlight.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim() || null,
          metric: form.metric.trim() || null,
          impact: form.impact.trim() || null,
          tags: parseTags(form.tags),
        }),
      })
      const body = (await res.json().catch(() => null)) as { highlight?: EntryHighlight } | null
      if (res.ok && body?.highlight) {
        onUpdate(body.highlight)
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleteOpen(false)
    setDeleting(true)
    try {
      const res = await fetch(`/api/entries/${entryId}/highlights/${highlight.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(highlight.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? t('highlight.collapse') : t('highlight.expand')}
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-2 px-3 py-2 text-left min-h-[48px] transition-opacity hover:opacity-80"
        style={{ color: 'var(--foreground)' }}
      >
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium leading-snug">{summaryTitle}</span>
          {highlight.metric && (
            <span className="block text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {highlight.metric}
            </span>
          )}
        </span>
        <span className="shrink-0 mt-0.5" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {editing ? (
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {t('highlight.titleLabel')}
                <input
                  aria-label={t('highlight.titleLabel')}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="text-sm rounded-lg px-2 py-1.5 border"
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {t('highlight.metricLabel')}
                <input
                  aria-label={t('highlight.metricLabel')}
                  value={form.metric}
                  onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value }))}
                  className="text-sm rounded-lg px-2 py-1.5 border"
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {t('highlight.impactLabel')}
                <textarea
                  aria-label={t('highlight.impactLabel')}
                  value={form.impact}
                  onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value }))}
                  rows={2}
                  className="text-sm rounded-lg px-2 py-1.5 border resize-y"
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {t('highlight.tagsLabel')}
                <input
                  aria-label={t('highlight.tagsLabel')}
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="text-sm rounded-lg px-2 py-1.5 border"
                  style={inputStyle}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 min-h-[44px] rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                >
                  <Check size={12} aria-hidden="true" />
                  {saving ? '…' : t('highlight.save')}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 min-h-[44px] rounded-full transition-opacity hover:opacity-80"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  <X size={12} aria-hidden="true" />
                  {t('highlight.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {highlight.impact && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  {highlight.impact}
                </p>
              )}
              {highlight.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {highlight.tags.map((tag) => (
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
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 min-h-[48px] rounded-full transition-opacity hover:opacity-80"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <Pencil size={12} aria-hidden="true" />
                  {t('highlight.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  disabled={deleting}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 min-h-[48px] rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ color: 'var(--destructive)' }}
                >
                  <Trash2 size={12} aria-hidden="true" />
                  {t('highlight.delete')}
                </button>
              </div>
            </>
          )}
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
                {t('highlight.deleteConfirm.title')}
              </Dialog.Title>
              <Dialog.Description className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('highlight.deleteConfirm.description')}
              </Dialog.Description>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-sm font-medium px-4 py-2 min-h-[48px] rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  {t('highlight.deleteConfirm.cancel')}
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="inline-flex items-center justify-center text-sm font-medium px-4 py-2 min-h-[48px] rounded-lg transition-opacity hover:opacity-90"
                style={{ background: 'var(--destructive)', color: 'var(--color-primary-fg)' }}
              >
                {t('highlight.deleteConfirm.confirm')}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
