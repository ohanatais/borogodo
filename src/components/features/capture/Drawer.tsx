'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, TouchEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PenLine, X, AlertCircle, Image as ImageIcon, Link2, Sparkles, Loader2 } from 'lucide-react'
import { DrawerTextarea } from './DrawerTextarea'
import { AttachTile } from './AttachTile'
import { SavedPanel } from './SavedPanel'
import { DetailsFields } from './DetailsFields'
import { AudioButton } from './AudioButton'
import { useDrawerDraft } from '@/hooks/useDrawerDraft'
import type { DrawerManualFields } from '@/hooks/useDrawerDraft'
import type { ManualFields } from '@/lib/capture/saveDeposito'
import {
  dispatchEntryUpdated,
  dispatchEntryHighlightsUpdated,
  type EditEntryDetail,
} from '@/components/features/painel/registroTriggerEvents'
import type { FeedHighlight } from '@/lib/feed/types'

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
  /** Registros → Editar (026): quando presente, o Drawer abre em modo edição de uma fonte já
   * salva — pré-preenche texto cru + campos manuais, e salvar vira `PATCH` em vez de criar. */
  editEntry?: EditEntryDetail
  /** Vocabulário de contextos da pessoa (Story 2) — alimenta o `ContextPillPicker` embutido em
   * `DetailsFields`, em modo local (sem `entryId`: seleção só atualiza o rascunho). */
  contextVocabulary?: string[]
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
export function Drawer({ open, onOpenChange, initialText = '', onSaved, editEntry, contextVocabulary }: DrawerProps) {
  const t = useTranslations('registro')
  const router = useRouter()
  const draft = useDrawerDraft(initialText)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [savedResult, setSavedResult] = useState<DrawerSaveResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [linkInputOpen, setLinkInputOpen] = useState(false)
  const [linkInputValue, setLinkInputValue] = useState('')
  const [linkInputError, setLinkInputError] = useState(false)
  // "Organizar" no Drawer, antes de salvar — mesma extração de `organizeEntry`, sem persistir
  // nada ainda (POST /api/capture/organize-preview). "done" força "+ adicionar detalhes" aberto.
  const [organizeState, setOrganizeState] = useState<'idle' | 'organizing' | 'done'>('idle')
  // Editar uma fonte com 2+ destaques reais (revisão pós-implementação, 026): Métrica/Impacto
  // representam UM destaque só — sem efeito real numa fonte com vários, já que nenhuma tela
  // mostra esses campos legados quando há 2+. No lugar, mostra a lista (só leitura) dos destaques
  // atuais + "Organizar de novo" — a mesma ação do card, aqui dentro, pra não mandar a pessoa
  // fechar o Drawer e procurar o botão em outro lugar (revisão manual: o aviso antigo mencionava
  // um botão que não existia dentro do Drawer). Derivado da contagem AO VIVO de `editHighlights`
  // (não do flag `editEntry.isMultiHighlight`, congelado no momento do clique em "Editar") — assim
  // reorganizar aqui dentro reflete na hora se o número de destaques mudou.
  const [editHighlights, setEditHighlights] = useState<FeedHighlight[]>([])
  const [reorganizingEdit, setReorganizingEdit] = useState(false)
  const isMultiHighlightEdit = editHighlights.length > 1
  const dialogRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const touchStartYRef = useRef<number | null>(null)
  const triggerElementRef = useRef<HTMLElement | null>(null)
  // Marca que esta sessão do drawer entrou em modo edição — usado pra decidir se o fechamento
  // deve limpar o rascunho (edição) ou preservá-lo (criação, FR-012a).
  const wasEditingRef = useRef(false)

  // FR-012a: o Drawer fica sempre montado (draft sobrevive a fechar sem salvar), então o valor
  // inicial de `useDrawerDraft` só pega o `initialText` da primeira renderização. Este efeito
  // sincroniza aberturas seguintes vindas do gatilho do Painel (US5) — só quando chega texto novo.
  useEffect(() => {
    if (initialText) draft.setRawText(initialText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText])

  // Registros → Editar (026): pré-preenche texto cru + campos manuais quando o drawer abre em
  // modo edição — dispara só quando o id muda (nova abertura), não a cada re-render.
  useEffect(() => {
    if (!editEntry) return
    draft.setRawText(editEntry.rawText)
    const fields = editEntry.manualFields
    if (fields?.metric) draft.setManualField('metric', fields.metric)
    if (fields?.impact) draft.setManualField('impact', fields.impact)
    if (fields?.tags) draft.setManualField('tags', fields.tags)
    if (fields?.company) draft.setManualField('company', fields.company)
    if (fields?.isPersonalProject) draft.setManualField('isPersonalProject', fields.isPersonalProject)
    if (fields?.entryDate) draft.setManualField('entryDate', fields.entryDate)
    // Sincroniza com o `editEntry` recém-chegado (mesmo padrão de `draft.setRawText` acima, só
    // que local em vez de opaco a um hook importado, por isso o lint enxerga este e não os outros).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditHighlights(editEntry.highlights ?? [])
    wasEditingRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editEntry?.id])

  // Uma edição fechada (salva ou não) nunca deve "vazar" como rascunho de um Registrar em branco
  // depois — diferente do rascunho de criação (FR-012a, que sobrevive de propósito a um fechar
  // sem salvar), o texto pré-preenchido de uma edição não é um rascunho novo da pessoa.
  //
  // `savedResult` (tela de sucesso) também precisa ser limpo aqui, sempre — o Drawer fica
  // montado entre aberturas, e fechar de qualquer jeito que não seja "Concluir" (handleDone),
  // como clicar fora ou no X, deixava esse estado preso. Reabrir o Drawer (pra editar outra
  // fonte, ou pra um novo registro) reexibia a tela de sucesso do registro salvo anteriormente
  // em vez do conteúdo esperado.
  useEffect(() => {
    if (!open) {
      // Sincroniza com o efeito colateral real de `draft.reset()` (revoga object URLs de anexo)
      // logo abaixo — não é um espelho de prop em state que desse pra resolver ajustando estado
      // durante o render.
      /* eslint-disable react-hooks/set-state-in-effect */
      setSavedResult(null)
      setStatus('idle')
      /* eslint-enable react-hooks/set-state-in-effect */
      if (wasEditingRef.current) {
        draft.reset()
        wasEditingRef.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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
    if (attachmentIds.length === 0) return

    for (const id of attachmentIds) {
      await uploadAttachment(entryId, id)
    }

    // Registro já apareceu na lista (refresh logo após o insert); os anexos sobem em
    // background, então a lista pode ter mostrado o registro sem evidências por um instante.
    // Refresh de novo aqui garante que a lista reflita os anexos assim que terminarem.
    router.refresh()
  }

  /**
   * Registros → Editar (026): PATCH na fonte existente em vez de criar uma nova (FR alinhado a
   * "editar o registro em si", não o destaque). Sem `SavedPanel` — fecha direto ao salvar, já
   * que não é uma primeira captura.
   */
  async function handleEditSubmit(entry: EditEntryDetail): Promise<void> {
    try {
      const fields = draft.manualFields
      const body: Record<string, string | string[] | boolean | null> = { what_i_did: draft.rawText }
      if (fields.metric.trim()) body.metric = fields.metric.trim()
      if (fields.impact.trim()) body.impact = fields.impact.trim()
      const tags = fields.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      if (tags.length > 0) body.tags = tags
      // Empresa/projeto pessoal são mutuamente exclusivos e pré-preenchidos com o estado atual do
      // servidor ao abrir a edição (handleEditClick) — sempre mandar os dois, mesmo sem toque,
      // evita persistir os dois marcados ao mesmo tempo quando só um deles muda.
      body.is_personal_project = fields.isPersonalProject
      body.company = fields.isPersonalProject ? null : fields.company.trim() || null
      if (fields.entryDate.trim()) body.entry_date = fields.entryDate.trim()

      const response = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        setStatus('error')
        return
      }

      const pendingAttachmentIds = draft.attachments.map((a) => a.id)
      setStatus('idle')
      onSaved?.({ id: entry.id, title: draft.rawText.slice(0, 60) })
      dispatchEntryUpdated({
        id: entry.id,
        what_i_did: draft.rawText,
        metric: fields.metric.trim(),
        impact: fields.impact.trim(),
        company: fields.company.trim(),
        entryDate: fields.entryDate.trim(),
      })
      router.refresh()
      void uploadPendingAttachments(entry.id, pendingAttachmentIds)
      draft.reset()
      onOpenChange(false)
    } catch {
      setStatus('error')
    }
  }

  async function handleSubmit() {
    if (!draft.hasContent || status === 'saving') return

    setStatus('saving')

    if (editEntry) {
      await handleEditSubmit(editEntry)
      return
    }

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

  /**
   * "Organizar" no Drawer, antes de salvar — mesma extração de `organizeEntry`, mas via
   * `/organize-preview`: não persiste nada, só devolve o resultado pra pré-preencher os campos
   * manuais do rascunho. Só preenche campo vazio (mesma regra "só preenche vazios" de FR-002) —
   * nunca sobrescreve o que a pessoa já digitou. Falha vira silêncio, sem popup (FR-030).
   */
  async function handleOrganizePreview() {
    if (!draft.hasContent || organizeState === 'organizing') return
    setOrganizeState('organizing')
    try {
      const res = await fetch('/api/capture/organize-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: draft.rawText,
          company: draft.manualFields.company.trim() || null,
          entryDate: draft.manualFields.entryDate.trim() || null,
        }),
      })
      const body = (await res.json().catch(() => null)) as
        | { status?: string; highlights?: { metric: string | null; impact: string | null; tags: string[] }[]; company?: string | null; entry_date?: string | null }
        | null

      if (!res.ok || body?.status !== 'organized') {
        setOrganizeState('idle')
        return
      }

      const firstHighlight = body.highlights?.[0]
      if (firstHighlight?.metric && !draft.manualFields.metric.trim()) draft.setManualField('metric', firstHighlight.metric)
      if (firstHighlight?.impact && !draft.manualFields.impact.trim()) draft.setManualField('impact', firstHighlight.impact)
      if (firstHighlight?.tags?.length && !draft.manualFields.tags.trim()) draft.setManualField('tags', firstHighlight.tags.join(', '))
      if (body.company && !draft.manualFields.company.trim()) draft.setManualField('company', body.company)
      if (body.entry_date && !draft.manualFields.entryDate.trim()) draft.setManualField('entryDate', body.entry_date)

      setOrganizeState('done')
    } catch {
      setOrganizeState('idle')
    }
  }

  /**
   * "Organizar de novo" de DENTRO do Drawer, ao editar uma fonte com 2+ destaques — mesma chamada
   * real do card (`POST /api/entries/[id]/organize`, persiste e SUBSTITUI os destaques, ver
   * `organizeEntry.ts`), trazida pra cá porque o aviso mencionar um botão só existente em outra
   * tela (o card, fora do Drawer) era inconsistente (revisão manual). Notifica o card via evento
   * pra ele refletir a substituição sem esperar um reload de página inteira.
   */
  async function handleReorganizeInDrawer() {
    if (!editEntry || reorganizingEdit) return
    setReorganizingEdit(true)
    try {
      const res = await fetch(`/api/entries/${editEntry.id}/organize`, { method: 'POST' })
      const body = (await res.json().catch(() => null)) as { status?: string; highlights?: FeedHighlight[] } | null
      if (res.ok && body?.status === 'organized' && body.highlights) {
        setEditHighlights(body.highlights)
        dispatchEntryHighlightsUpdated({ id: editEntry.id, highlights: body.highlights })
        router.refresh()
      }
    } finally {
      setReorganizingEdit(false)
    }
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

    let hostname: string
    try {
      hostname = new URL(url).hostname.replace(/^www\./, '')
    } catch {
      setLinkInputError(true)
      return
    }

    draft.addLinkAttachment(url, hostname)
    setLinkInputValue('')
    setLinkInputError(false)
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
        className="relative flex flex-col w-full h-[80dvh] rounded-t-[20px] lg:h-full lg:w-[600px] lg:rounded-none lg:rounded-l-2xl overflow-hidden"
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
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 py-3 gap-3">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  <ImageIcon size={13} aria-hidden="true" />
                  {t('drawer.imageButton')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLinkInputError(false)
                    setLinkInputOpen((v) => !v)
                  }}
                  aria-label={t('attach.linkAriaLabel')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  <Link2 size={13} aria-hidden="true" />
                  {t('drawer.linkButton')}
                </button>
                <AudioButton onTranscript={handleAudioTranscript} />
              </div>

              {isMultiHighlightEdit ? (
                <div className="flex flex-col gap-2.5 rounded-xl p-3.5" style={{ background: 'var(--color-lilas-nevoa)' }}>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    <Sparkles size={12} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
                    {t('highlightsSectionLabel')}
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {editHighlights.map((highlight, index) => (
                      <li key={highlight.id} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                          style={{ width: 18, height: 18, background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
                        >
                          {index + 1}
                        </span>
                        <span className="leading-snug">
                          {highlight.title || t('highlight.untitled')}
                          {highlight.metric && (
                            <span className="ml-1.5 font-medium" style={{ color: 'var(--color-accent-text)' }}>
                              {highlight.metric}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => void handleReorganizeInDrawer()}
                    disabled={reorganizingEdit}
                    className="inline-flex items-center gap-2 self-start px-4 py-2.5 rounded-full text-xs font-semibold transition-opacity disabled:opacity-45"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                  >
                    {reorganizingEdit ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles size={14} aria-hidden="true" />
                    )}
                    {reorganizingEdit ? t('organize.organizing') : t('organize.ctaAgain')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl p-3.5" style={{ background: 'var(--color-lilas-nevoa)' }}>
                  <button
                    type="button"
                    onClick={() => void handleOrganizePreview()}
                    disabled={!draft.hasContent || organizeState === 'organizing'}
                    className="inline-flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold transition-opacity disabled:opacity-45"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                  >
                    {organizeState === 'organizing' ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles size={14} aria-hidden="true" />
                    )}
                    {organizeState === 'organizing' ? t('organize.organizing') : t('organize.cta')}
                  </button>
                  <p className="text-xs leading-snug" style={{ color: 'var(--muted-foreground)' }}>
                    {t('drawer.organizeHint')}{' '}
                    <strong className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {t('drawer.organizeOptional')}
                    </strong>
                  </p>
                </div>
              )}

              <DetailsFields
                values={draft.manualFields}
                onChange={draft.setManualField}
                hideMetricImpact={isMultiHighlightEdit}
                forceOpen={editEntry ? `edit-${editEntry.id}` : organizeState === 'done'}
                contextVocabulary={contextVocabulary}
              />

              {linkInputOpen && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={linkInputValue}
                      onChange={(e) => {
                        setLinkInputValue(e.target.value)
                        setLinkInputError(false)
                      }}
                      placeholder={t('attach.linkInputPlaceholder')}
                      aria-label={t('attach.linkInputLabel')}
                      aria-invalid={linkInputError}
                      autoFocus
                      className="flex-1 rounded-xl px-3 py-2 text-sm outline-none focus-visible:shadow-none"
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
                  {linkInputError && (
                    <span role="alert" className="text-xs px-3" style={{ color: 'var(--color-accent)' }}>
                      {t('attach.linkInputError')}
                    </span>
                  )}
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
                  {editEntry ? t('drawer.updateButton') : t('drawer.submitButton')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
