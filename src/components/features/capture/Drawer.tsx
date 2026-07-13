'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, TouchEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PenLine, X, AlertCircle, Image as ImageIcon, Link2 } from 'lucide-react'
import { DrawerTextarea } from './DrawerTextarea'
import { AttachTile } from './AttachTile'
import { SavedPanel } from './SavedPanel'
import { DetailsFields } from './DetailsFields'
import { AudioButton } from './AudioButton'
import { useDrawerDraft } from '@/hooks/useDrawerDraft'
import type { DrawerManualFields } from '@/hooks/useDrawerDraft'
import type { ManualFields } from '@/lib/capture/saveDeposito'

export interface DrawerSaveResult {
  id: string
  title: string
}

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Preenchido quando a pessoa começa a digitar/colar direto no gatilho do Painel (FR-012a). */
  initialText?: string
  onSaved?: (result: DrawerSaveResult) => void
}

type SaveStatus = 'idle' | 'saving' | 'error'

// US7: distância de deslize pra baixo (px) na alça do bottom sheet mobile que fecha o drawer.
const SWIPE_CLOSE_THRESHOLD_PX = 80

/**
 * Uma chamada a `POST /api/entries/[id]/evidence` por anexo, feita só depois que a entry já
 * existe (contracts/capture.md) — rota existente, sem alteração.
 */
/**
 * Converte o rascunho local dos campos manuais (US4) pro formato do contrato de
 * `POST /api/capture` — omite o campo inteiro quando nada foi preenchido, e omite cada chave
 * individualmente quando vazia, pra nunca mandar `manualFields` "vazio de propósito".
 */
function buildManualFieldsPayload(fields: DrawerManualFields): ManualFields | undefined {
  const metric = fields.metric.trim()
  const impact = fields.impact.trim()
  const company = fields.company.trim()
  const entryDate = fields.entryDate.trim()
  const tags = fields.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  const hasAnyField = Boolean(metric || impact || company || entryDate || tags.length > 0)
  if (!hasAnyField) return undefined

  return {
    ...(metric && { metric }),
    ...(impact && { impact }),
    ...(tags.length > 0 && { tags }),
    ...(company && { company }),
    ...(entryDate && { entryDate }),
  }
}

async function uploadAttachmentToEntry(
  entryId: string,
  attachment: { kind: 'image' | 'link'; file?: File; url?: string; label?: string }
): Promise<boolean> {
  try {
    let response: Response
    if (attachment.kind === 'image' && attachment.file) {
      const formData = new FormData()
      formData.append('file', attachment.file)
      if (attachment.label) formData.append('label', attachment.label)
      response = await fetch(`/api/entries/${entryId}/evidence`, { method: 'POST', body: formData })
    } else {
      response = await fetch(`/api/entries/${entryId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', value: attachment.url, ...(attachment.label ? { label: attachment.label } : {}) }),
      })
    }
    return response.ok
  } catch {
    return false
  }
}

/**
 * Drawer bloco-de-notas que sempre salva (US1) — nenhuma chamada de IA no caminho de salvar
 * (FR-004), nenhuma rejeição por tamanho de texto (FR-001/FR-002). Anexos (US2) sobem depois que
 * a entry já existe; confirmação editável (US3) substitui o corpo do drawer após salvar. Campos
 * manuais (US4) chegam em fase seguinte desta feature.
 */
export function Drawer({ open, onOpenChange, initialText = '', onSaved }: DrawerProps) {
  const t = useTranslations('registro')
  const router = useRouter()
  const draft = useDrawerDraft(initialText)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [savedResult, setSavedResult] = useState<DrawerSaveResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [linkInputOpen, setLinkInputOpen] = useState(false)
  const [linkInputValue, setLinkInputValue] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const touchStartYRef = useRef<number | null>(null)
  const triggerElementRef = useRef<HTMLElement | null>(null)

  // FR-012a: o Drawer fica sempre montado (draft sobrevive a fechar sem salvar), então o valor
  // inicial de `useDrawerDraft` só pega o `initialText` da primeira renderização. Este efeito
  // sincroniza aberturas seguintes vindas do gatilho do Painel (US5) — só quando chega texto novo.
  useEffect(() => {
    if (initialText) draft.setRawText(initialText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText])

  // Foco: guarda o elemento que abriu o drawer e devolve o foco a ele ao fechar (WCAG 2.4.3);
  // enquanto aberto, foca o próprio diálogo e prende o Tab dentro dele (sem isso, Tab escapa
  // pro conteúdo por trás mesmo com o drawer visualmente aberto).
  useEffect(() => {
    if (!open) return

    triggerElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    // Foco inicial fica a cargo do `autoFocus` da `DrawerTextarea` (textarea é o alvo natural
    // de foco ao abrir); este efeito só prende o Tab e devolve o foco ao fechar.
    const dialogNode = dialogRef.current

    function getFocusableElements(): HTMLElement[] {
      if (!dialogNode) return []
      return Array.from(
        dialogNode.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onOpenChange(false)
        return
      }
      if (event.key !== 'Tab') return

      const elements = getFocusableElements()
      if (elements.length === 0) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      triggerElementRef.current?.focus()
    }
  }, [open, onOpenChange])

  if (!open) return null

  async function uploadAttachment(entryId: string, attachmentId: string) {
    const attachment = draft.attachments.find((a) => a.id === attachmentId)
    if (!attachment) return

    draft.setAttachmentStatus(attachmentId, 'uploading')
    const ok = await uploadAttachmentToEntry(entryId, attachment)
    draft.setAttachmentStatus(attachmentId, ok ? 'done' : 'error')
  }

  async function uploadPendingAttachments(entryId: string, attachmentIds: string[]) {
    for (const id of attachmentIds) {
      await uploadAttachment(entryId, id)
    }
  }

  async function handleSubmit() {
    if (!draft.hasContent || status === 'saving') return

    setStatus('saving')

    try {
      const manualFields = buildManualFieldsPayload(draft.manualFields)
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'deposito',
          rawText: draft.rawText,
          ...(manualFields && { manualFields }),
        }),
      })

      if (!response.ok) {
        setStatus('error')
        return
      }

      const result = (await response.json()) as DrawerSaveResult
      const pendingAttachmentIds = draft.attachments.map((a) => a.id)
      setStatus('idle')
      setSavedResult(result)
      onSaved?.(result)
      router.refresh()
      void uploadPendingAttachments(result.id, pendingAttachmentIds)
    } catch {
      setStatus('error')
    }
  }

  function handleDone() {
    draft.reset()
    setSavedResult(null)
    onOpenChange(false)
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) draft.addImageAttachment(file)
    event.target.value = ''
  }

  /** FR-018: transcrição de voz cai no mesmo campo de texto do bloco-de-notas, sem virar anexo. */
  function handleAudioTranscript(text: string) {
    const next = draft.rawText.trim().length > 0 ? `${draft.rawText}\n${text}` : text
    draft.setRawText(next)
  }

  function addImageFiles(files: File[]) {
    files.filter((file) => file.type.startsWith('image/')).forEach((file) => draft.addImageAttachment(file))
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragActive(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragActive(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragActive(false)
    addImageFiles(Array.from(event.dataTransfer?.files ?? []))
  }

  function handleLinkConfirm() {
    const url = linkInputValue.trim()
    if (!url) return

    let label: string | undefined
    try {
      label = new URL(url).hostname.replace(/^www\./, '')
    } catch {
      label = undefined
    }

    draft.addLinkAttachment(url, label)
    setLinkInputValue('')
    setLinkInputOpen(false)
  }

  // Bottom sheet mobile (US7): gesto de deslizar pra baixo na alça fecha o drawer, igual a um
  // toque fora. Simplificado — sem animação de arraste elástico (não trivial de validar em
  // jsdom); o fechamento em si é real, só a resposta visual durante o arraste que fica pro toque
  // fora/botão fechar, já cobertos.
  function handleHandleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartYRef.current = event.touches[0]?.clientY ?? null
  }

  function handleHandleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (touchStartYRef.current === null) return
    const currentY = event.touches[0]?.clientY ?? touchStartYRef.current
    if (currentY - touchStartYRef.current > SWIPE_CLOSE_THRESHOLD_PX) {
      touchStartYRef.current = null
      onOpenChange(false)
    }
  }

  function handleHandleTouchEnd() {
    touchStartYRef.current = null
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end lg:items-stretch lg:justify-end"
      style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(2px)' }}
      onClick={() => onOpenChange(false)}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('drawer.title')}
        onClick={(e) => e.stopPropagation()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative flex flex-col w-full h-[80dvh] rounded-t-[20px] lg:h-full lg:w-[480px] lg:rounded-none lg:rounded-l-2xl overflow-hidden"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-modal)' }}
      >
        {dragActive && (
          <div
            data-testid="drawer-drag-overlay"
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none rounded-t-[20px] lg:rounded-none lg:rounded-l-2xl"
            style={{ background: 'var(--color-accent-wash)', border: '2px dashed var(--color-accent)' }}
          />
        )}

        {/* Alça de arrastar (US7) — só no bottom sheet mobile; deslizar pra baixo fecha (FR do US7). */}
        <div
          data-testid="drawer-mobile-handle"
          className="lg:hidden flex justify-center pt-2 pb-1 shrink-0 touch-none"
          onTouchStart={handleHandleTouchStart}
          onTouchMove={handleHandleTouchMove}
          onTouchEnd={handleHandleTouchEnd}
          aria-hidden="true"
        >
          <span className="w-9 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-accent-wash)', color: 'var(--color-accent-text)' }}
              aria-hidden="true"
            >
              <PenLine size={14} />
            </span>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {t('drawer.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('drawer.closeAriaLabel')}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <X size={16} />
          </button>
        </div>

        {savedResult ? (
          <SavedPanel
            entryId={savedResult.id}
            initialTitle={savedResult.title}
            attachments={draft.attachments}
            onRetryAttachment={(id) => void uploadAttachment(savedResult.id, id)}
            onDone={handleDone}
          />
        ) : (
          <>
            <div className="flex-1 flex flex-col min-h-0 px-4 py-3 gap-3">
              <DrawerTextarea
                value={draft.rawText}
                onChange={draft.setRawText}
                onImagePaste={draft.addImageAttachment}
                disabled={status === 'saving'}
                autoFocus
              />

              {draft.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {draft.attachments.map((att) => (
                    <AttachTile
                      key={att.id}
                      kind={att.kind}
                      previewUrl={att.previewUrl}
                      label={att.label}
                      status={att.status}
                      onRemove={() => draft.removeAttachment(att.id)}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={t('attach.imageAriaLabel')}
                  className="inline-flex items-center gap-1.5 px-3 min-h-12 rounded-full text-xs font-medium"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  <ImageIcon size={13} aria-hidden="true" />
                  {t('drawer.imageButton')}
                </button>
                <button
                  type="button"
                  onClick={() => setLinkInputOpen((v) => !v)}
                  aria-label={t('attach.linkAriaLabel')}
                  className="inline-flex items-center gap-1.5 px-3 min-h-12 rounded-full text-xs font-medium"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  <Link2 size={13} aria-hidden="true" />
                  {t('drawer.linkButton')}
                </button>
                <AudioButton onTranscript={handleAudioTranscript} />
              </div>

              <DetailsFields values={draft.manualFields} onChange={draft.setManualField} />

              {linkInputOpen && (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={linkInputValue}
                    onChange={(e) => setLinkInputValue(e.target.value)}
                    placeholder={t('attach.linkInputPlaceholder')}
                    aria-label={t('attach.linkInputLabel')}
                    autoFocus
                    className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  />
                  <button
                    type="button"
                    onClick={handleLinkConfirm}
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                  >
                    {t('attach.linkConfirm')}
                  </button>
                </div>
              )}

              {status === 'error' && (
                <div
                  role="alert"
                  className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs"
                  style={{ background: 'var(--color-accent-wash)', color: 'var(--foreground)' }}
                >
                  <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{t('error.saveFailed')}</span>
                </div>
              )}
            </div>

            <div
              className="px-4 py-3 border-t shrink-0 flex items-center justify-end gap-2"
              style={{ borderColor: 'var(--border)' }}
            >
              {status === 'error' ? (
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                >
                  {t('error.retry')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!draft.hasContent || status === 'saving'}
                  className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                >
                  {t('drawer.submitButton')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
