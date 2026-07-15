'use client'

import { useCallback, useState } from 'react'

export interface DrawerManualFields {
  metric: string
  impact: string
  tags: string
  company: string
  entryDate: string
}

const EMPTY_MANUAL_FIELDS: DrawerManualFields = {
  metric: '',
  impact: '',
  tags: '',
  company: '',
  entryDate: '',
}

export type DrawerAttachmentStatus = 'pending' | 'uploading' | 'done' | 'error'

/**
 * Anexo em estado local (US2) — nenhuma chamada de rede acontece até o clique em "Registrar"
 * (contracts/capture.md). `file` só existe para imagens (upload real acontece depois, via
 * `POST /api/entries/[id]/evidence`); `url` só existe para links.
 */
export interface DrawerAttachment {
  id: string
  kind: 'image' | 'link'
  file?: File
  url?: string
  /** URL de preview local (`URL.createObjectURL`) para imagem, ou a própria URL para link. */
  previewUrl: string
  label?: string
  status: DrawerAttachmentStatus
}

export interface UseDrawerDraftResult {
  rawText: string
  setRawText: (text: string) => void
  manualFields: DrawerManualFields
  setManualField: (field: keyof DrawerManualFields, value: string) => void
  attachments: DrawerAttachment[]
  addImageAttachment: (file: File) => void
  addLinkAttachment: (url: string, label?: string) => void
  removeAttachment: (id: string) => void
  setAttachmentStatus: (id: string, status: DrawerAttachmentStatus) => void
  hasContent: boolean
  reset: () => void
}

function createAttachmentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `att-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Mantém o rascunho do drawer (texto + anexos + campos manuais) em memória durante a sessão.
 * Fechar o drawer sem salvar descarta tudo (FR-015) — não existe conceito de rascunho persistente
 * nesta feature (decision record: "registro cru é real", sem estado intermediário salvo).
 *
 * Anexos vivem só neste hook até o clique em "Registrar" — remover um anexo antes disso é
 * puramente local, nunca gera chamada de rede (data-model.md).
 */
export function useDrawerDraft(initialText = ''): UseDrawerDraftResult {
  const [rawText, setRawText] = useState(initialText)
  const [manualFields, setManualFields] = useState<DrawerManualFields>(EMPTY_MANUAL_FIELDS)
  const [attachments, setAttachments] = useState<DrawerAttachment[]>([])

  const setManualField = useCallback((field: keyof DrawerManualFields, value: string) => {
    setManualFields((prev) => ({ ...prev, [field]: value }))
  }, [])

  const addImageAttachment = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file)
    setAttachments((prev) => [
      ...prev,
      { id: createAttachmentId(), kind: 'image', file, previewUrl, status: 'pending' },
    ])
  }, [])

  const addLinkAttachment = useCallback((url: string, label?: string) => {
    setAttachments((prev) => [
      ...prev,
      { id: createAttachmentId(), kind: 'link', url, previewUrl: url, label, status: 'pending' },
    ])
  }, [])

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id)
      if (target?.kind === 'image') {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const setAttachmentStatus = useCallback((id: string, status: DrawerAttachmentStatus) => {
    setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }, [])

  const reset = useCallback(() => {
    setRawText('')
    setManualFields(EMPTY_MANUAL_FIELDS)
    setAttachments((prev) => {
      prev.forEach((a) => {
        if (a.kind === 'image') URL.revokeObjectURL(a.previewUrl)
      })
      return []
    })
  }, [])

  return {
    rawText,
    setRawText,
    manualFields,
    setManualField,
    attachments,
    addImageAttachment,
    addLinkAttachment,
    removeAttachment,
    setAttachmentStatus,
    hasContent: rawText.trim().length > 0 || attachments.length > 0,
    reset,
  }
}
