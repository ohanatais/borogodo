'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'
import type { FeedItem } from '@/lib/feed/types'
import type { EntrySource } from '@/types/entry'
import { UsarButton } from '@/components/features/content/UsarButton'

interface EntryCardProps {
  item: FeedItem
  variant: 'feed' | 'panel'
  onDelete?: (id: string) => void
}

const SOURCE_ICON: Record<EntrySource, string> = {
  text: '📝',
  chips: '📝',
  audio: '🎙️',
  linkedin_pdf: '📄',
  image: '🖼️',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function EntryCard({ item, variant, onDelete }: EntryCardProps) {
  const t = useTranslations('feed')
  const [expanded, setExpanded] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const displayDate = item.entry_date ?? item.created_at
  const dateLabel = formatDate(displayDate)

  function handleConfirmDelete() {
    setDeleteOpen(false)
    onDelete?.(item.id)
  }

  return (
    <li className="rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <button
        type="button"
        aria-expanded={expanded}
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
            {item.company && <span>· {item.company}</span>}
          </span>
        </span>
        <span
          className="text-xs shrink-0 mt-0.5 px-1 py-0.5 rounded"
          style={{ color: 'var(--muted-foreground)' }}
          aria-hidden="true"
        >
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {item.what_i_did}
          </p>

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
              seedSummary={item.what_i_did}
              formats={['post', 'impact_summary']}
            />

            {variant === 'feed' && onDelete && (
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
            style={{ background: 'oklch(18% 0.02 260 / 0.4)', backdropFilter: 'blur(2px)' }}
          />
          <Dialog.Content
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,380px)] rounded-2xl p-6 flex flex-col gap-5 focus:outline-none"
            style={{ background: 'var(--color-creme)', boxShadow: '0 8px 40px oklch(18% 0.02 260 / 0.25)' }}
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
