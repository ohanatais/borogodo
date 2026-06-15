'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { Draft, DraftFormat, DraftStatus } from '@/types/content'
import { CopyButton } from './CopyButton'
import { patchDraft } from './draftsClient'

interface PresencaListProps {
  drafts: Draft[]
}

const FORMAT_LABEL_KEY: Record<DraftFormat, string> = {
  post: 'formats.post',
  impact_summary: 'formats.impactSummary',
}

const STATUS_LABEL_KEY: Record<DraftStatus, string> = {
  generated: 'page.status.generated',
  edited: 'page.status.edited',
  copied: 'page.status.copied',
  discarded: 'page.status.discarded',
}

/**
 * Lista dos rascunhos persistidos (hub mínimo da 013). Cada rascunho mostra formato, status e a
 * evidência base; copiar reaproveita o CopyButton e marca `copied` via PATCH. Sem edição/regeração
 * aqui — esse refino vive na superfície de geração; a 014 amplia este hub.
 */
export function PresencaList({ drafts }: PresencaListProps) {
  const t = useTranslations('presenca')
  const locale = useLocale()
  const dateFmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <ul className="flex flex-col gap-4">
      {drafts.map((draft) => (
        <li
          key={draft.id}
          className="flex flex-col gap-3 rounded-2xl p-4 border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span
              className="px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-primary)' }}
            >
              {t(FORMAT_LABEL_KEY[draft.format])}
            </span>
            <span>{t(STATUS_LABEL_KEY[draft.status])}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={draft.createdAt}>{dateFmt.format(new Date(draft.createdAt))}</time>
          </div>

          {draft.angle && (
            <p className="text-sm italic" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
              {draft.angle}
            </p>
          )}

          <p className="text-base whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {draft.body}
          </p>

          <div>
            <CopyButton text={draft.body} onCopied={() => void patchDraft(draft.id, { status: 'copied' })} />
          </div>
        </li>
      ))}
    </ul>
  )
}
