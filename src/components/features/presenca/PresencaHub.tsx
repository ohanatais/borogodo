'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { Draft, DraftFormat, DraftListPage, DraftStatusFilter } from '@/types/content'
import {
  PresencaCreate,
  type PresencaSeedEntry,
} from '@/components/features/content/PresencaCreate'
import {
  resumePresenca,
  PRESENCA_DRAFT_UPDATED_EVENT,
  type DraftUpdatedDetail,
} from '@/components/features/content/presencaEvents'
import { patchDraft, deleteDraft } from '@/components/features/content/draftsClient'
import { DraftListItem } from './DraftListItem'
import { StatusFilter } from './StatusFilter'
import { DeleteConfirm } from './DeleteConfirm'
import { originLabel } from './originLabel'

interface PresencaHubProps {
  initialPage: DraftListPage
  hasAnyDrafts: boolean
  themes: string[]
  entries: PresencaSeedEntry[]
}

function buildQuery(cursor: string | null, status: DraftStatusFilter, format: DraftFormat | null): string {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  if (status !== 'ativos') params.set('status', status)
  if (format) params.set('format', format)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/**
 * Corpo interativo do hub (US1+US2): lista paginada dos rascunhos, filtro por status/formato, e a
 * gestão total por item — retomar, copiar, arquivar/restaurar e excluir (com confirmação). Arquivar,
 * restaurar e excluir saem da lista de forma otimista, com rollback se a escrita falhar e transição
 * suave (Framer). Reusa o motor da 013 (retomar → `GenerateSheet`). Nunca mostra página em branco.
 */
export function PresencaHub({ initialPage, hasAnyDrafts, themes, entries }: PresencaHubProps) {
  const t = useTranslations('presenca')
  const [items, setItems] = useState<Draft[]>(initialPage.items)
  const [cursor, setCursor] = useState<string | null>(initialPage.nextCursor)
  const [status, setStatus] = useState<DraftStatusFilter>('ativos')
  const [format, setFormat] = useState<DraftFormat | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Draft | null>(null)
  const isFirstRun = useRef(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/content/drafts${buildQuery(null, status, format)}`)
      if (res.ok) {
        const page = (await res.json()) as DraftListPage
        setItems(page.items)
        setCursor(page.nextCursor)
      }
    } finally {
      setLoading(false)
    }
  }, [status, format])

  // Refetch do zero quando o filtro muda. O primeiro render usa a página vinda do servidor (RSC).
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    void reload()
  }, [reload])

  // Sincroniza com edições/cópias feitas no editor (GenerateSheet/DraftCard, fora do hub): atualiza
  // o item para o preview e o "retomar" refletirem na hora, sem reload.
  useEffect(() => {
    function handler(e: Event) {
      const d = (e as CustomEvent<DraftUpdatedDetail>).detail
      if (!d) return
      setItems((prev) =>
        prev.map((item) =>
          item.id === d.id
            ? { ...item, ...(d.body !== undefined && { body: d.body }), ...(d.status !== undefined && { status: d.status }) }
            : item
        )
      )
    }
    window.addEventListener(PRESENCA_DRAFT_UPDATED_EVENT, handler)
    return () => window.removeEventListener(PRESENCA_DRAFT_UPDATED_EVENT, handler)
  }, [])

  async function loadMore() {
    if (!cursor || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/content/drafts${buildQuery(cursor, status, format)}`)
      if (res.ok) {
        const page = (await res.json()) as DraftListPage
        setItems((prev) => [...prev, ...page.items])
        setCursor(page.nextCursor)
      }
    } finally {
      setLoading(false)
    }
  }

  /** Remove o item da lista na hora; desfaz (rollback) se a escrita no servidor falhar. */
  async function removeOptimistic(draft: Draft, action: () => Promise<boolean>) {
    const snapshot = items
    setItems((prev) => prev.filter((d) => d.id !== draft.id))
    const ok = await action()
    if (!ok) setItems(snapshot)
  }

  function handleResume(draft: Draft) {
    resumePresenca({
      draftId: draft.id,
      format: draft.format,
      seedType: draft.seedType,
      seedRef: draft.seedRef ?? '',
      angle: draft.angle,
      body: draft.body,
      seedSummary: originLabel(draft, t),
    })
  }

  function handleCopied(draft: Draft) {
    void patchDraft(draft.id, { status: 'copied' })
    setItems((prev) => prev.map((d) => (d.id === draft.id ? { ...d, status: 'copied' } : d)))
  }

  function handleArchive(draft: Draft) {
    void removeOptimistic(draft, async () => Boolean(await patchDraft(draft.id, { status: 'discarded' })))
  }

  function handleRestore(draft: Draft) {
    void removeOptimistic(draft, async () => Boolean(await patchDraft(draft.id, { status: 'edited' })))
  }

  function confirmDelete() {
    const target = deleteTarget
    setDeleteTarget(null)
    if (target) void removeOptimistic(target, () => deleteDraft(target.id))
  }

  const isPristineEmpty = items.length === 0 && !hasAnyDrafts

  return (
    <div className="flex flex-col gap-4">
      {hasAnyDrafts && (
        <StatusFilter
          status={status}
          format={format}
          onStatusChange={setStatus}
          onFormatChange={setFormat}
        />
      )}

      {items.length === 0 ? (
        isPristineEmpty ? (
          <div
            className="rounded-2xl border p-8 text-center flex flex-col items-center gap-4"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                {t('page.empty.title')}
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('page.empty.description')}
              </p>
            </div>
            <PresencaCreate themes={themes} entries={entries} />
          </div>
        ) : (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
            {t('filterEmpty')}
          </p>
        )
      ) : (
        <>
          <ul
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <AnimatePresence initial={false}>
              {items.map((draft) => (
                <DraftListItem
                  key={draft.id}
                  draft={draft}
                  onResume={() => handleResume(draft)}
                  onCopied={() => handleCopied(draft)}
                  onArchive={() => handleArchive(draft)}
                  onRestore={() => handleRestore(draft)}
                  onDelete={() => setDeleteTarget(draft)}
                />
              ))}
            </AnimatePresence>
          </ul>

          {cursor && (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loading}
              className="self-center inline-flex items-center justify-center text-sm font-medium px-4 py-2 min-h-[48px] rounded-full border transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              {t('loadMore')}
            </button>
          )}
        </>
      )}

      <DeleteConfirm
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
