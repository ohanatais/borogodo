'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { EntrySource } from '@/types/entry'
import { UsarButton } from '@/components/features/content/UsarButton'

interface EntryItemProps {
  id: string
  whatIDid: string
  source: EntrySource
  createdAt: string
}

const SOURCE_ICON: Record<EntrySource, string> = {
  text: '📝',
  chips: '📝',
  audio: '🎙️',
  linkedin_pdf: '📄',
  image: '🖼️',
}

const MS_PER_DAY = 86_400_000

function getRelativeDays(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / MS_PER_DAY)
}

export function EntryItem({ id, whatIDid, source, createdAt }: EntryItemProps) {
  const t = useTranslations('panel')
  const [expanded, setExpanded] = useState(false)
  const days = getRelativeDays(createdAt)

  let dateLabel: string
  if (days === 0) {
    dateLabel = t('entryDate.today')
  } else if (days === 1) {
    dateLabel = t('entryDate.yesterday')
  } else if (days < 7) {
    dateLabel = t('entryDate.days', { count: days })
  } else {
    dateLabel = t('entryDate.weeks', { count: Math.floor(days / 7) })
  }

  return (
    <li>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left min-h-[48px] transition-opacity hover:opacity-70"
        style={{ color: 'var(--foreground)' }}
      >
        <span aria-hidden="true">{SOURCE_ICON[source]}</span>
        <span className={`flex-1 ${expanded ? '' : 'line-clamp-1'}`}>{whatIDid}</span>
        <span className="text-xs shrink-0 mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {dateLabel}
        </span>
      </button>

      {/* "Usar" aparece ao expandir: gera post ou resumo de impacto a partir desta entrada (US2). */}
      {expanded && (
        <div className="px-3 pb-3 pl-9">
          <UsarButton
            seedType="entry"
            seedRef={id}
            seedSummary={whatIDid}
            formats={['post', 'impact_summary']}
          />
        </div>
      )}
    </li>
  )
}
