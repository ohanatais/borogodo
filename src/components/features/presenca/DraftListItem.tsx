'use client'

import { useLocale, useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Archive, Trash2, Undo2 } from 'lucide-react'
import type { Draft, DraftFormat, DraftStatus } from '@/types/content'
import { CopyButton } from '@/components/features/content/CopyButton'
import { originLabel } from './originLabel'

interface DraftListItemProps {
  draft: Draft
  onResume: () => void
  onCopied: () => void
  onArchive: () => void
  onRestore: () => void
  onDelete: () => void
}

const FORMAT_LABEL_KEY: Record<DraftFormat, string> = {
  post: 'formats.post',
  impact_summary: 'formats.impactSummary',
  mini_bio: 'formats.miniBio',
  self_assessment: 'formats.selfAssessment',
}

const STATUS_LABEL_KEY: Record<DraftStatus, string> = {
  generated: 'page.status.generated',
  edited: 'page.status.edited',
  copied: 'page.status.copied',
  discarded: 'page.status.discarded',
}

/** Ação de gestão só-ícone, alvo de toque adequado, rótulo acessível. Discreta; `destructive` = vermelha. */
function IconAction({
  label,
  onClick,
  destructive,
  children,
}: {
  label: string
  onClick: () => void
  destructive?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center min-w-[48px] min-h-[48px] md:min-w-[40px] md:min-h-[40px] rounded-lg transition-colors hover:bg-[var(--muted)]"
      style={{ color: destructive ? 'var(--destructive)' : 'var(--muted-foreground)' }}
    >
      {children}
    </button>
  )
}

/**
 * Um rascunho como **linha densa** (não card alto), pensada para escanear e gerir listas com dezenas
 * ou centenas de itens. A **linha inteira é clicável** e abre o rascunho para retomar/editar (mais
 * intuitivo que um botão dedicado); à direita ficam só as ações secundárias em ícone — copiar,
 * arquivar/restaurar e excluir (vermelha). Os separadores e o contorno ficam no container.
 */
export function DraftListItem({ draft, onResume, onCopied, onArchive, onRestore, onDelete }: DraftListItemProps) {
  const t = useTranslations('presenca')
  const locale = useLocale()
  const dateFmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' })
  const isArchived = draft.status === 'discarded'
  const title = draft.angle || draft.body

  return (
    <motion.li
      layout
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="border-b last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2 transition-colors hover:bg-[var(--muted)]">
        {/* A faixa toda abre o rascunho (retomar/editar). Só spans/time aqui dentro: é um <button>. */}
        <button
          type="button"
          onClick={onResume}
          aria-label={`${t('actions.resume')}: ${title}`}
          className="flex-1 min-w-0 min-h-[48px] text-left px-4 py-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]"
        >
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            <span
              className="px-1.5 py-0.5 rounded-full font-medium shrink-0"
              style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-primary)' }}
            >
              {t(FORMAT_LABEL_KEY[draft.format])}
            </span>
            <span className="shrink-0">{t(STATUS_LABEL_KEY[draft.status])}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={draft.createdAt} className="shrink-0">
              {dateFmt.format(new Date(draft.createdAt))}
            </time>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline truncate">{originLabel(draft, t)}</span>
          </span>

          <span
            className="block text-sm italic truncate mt-0.5"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
          >
            {title}
          </span>
          {draft.angle && (
            <span className="block text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
              {draft.body}
            </span>
          )}
        </button>

        <div className="shrink-0 flex items-center gap-0.5 pr-3">
          <CopyButton text={draft.body} onCopied={onCopied} iconOnly />
          {isArchived ? (
            <IconAction label={t('actions.restore')} onClick={onRestore}>
              <Undo2 size={16} aria-hidden="true" />
            </IconAction>
          ) : (
            <IconAction label={t('actions.archive')} onClick={onArchive}>
              <Archive size={16} aria-hidden="true" />
            </IconAction>
          )}
          <IconAction label={t('actions.delete')} onClick={onDelete} destructive>
            <Trash2 size={16} aria-hidden="true" />
          </IconAction>
        </div>
      </div>
    </motion.li>
  )
}
