'use client'

import { useState } from 'react'
import type { EntrySource } from '@/types/entry'

interface EntryItemProps {
  whatIDid: string
  source: EntrySource
}

const SOURCE_ICON: Record<EntrySource, string> = {
  text: '📝',
  chips: '📝',
  audio: '🎙️',
  linkedin_pdf: '📄',
  image: '🖼️',
}

export function EntryItem({ whatIDid, source }: EntryItemProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <li>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left min-h-[48px]"
        style={{ color: 'var(--foreground)' }}
      >
        <span aria-hidden="true">{SOURCE_ICON[source]}</span>
        <span className={expanded ? '' : 'line-clamp-1'}>{whatIDid}</span>
      </button>
    </li>
  )
}
