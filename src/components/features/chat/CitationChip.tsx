'use client'

import type { Citation } from '@/lib/ai/chat/answerCareerQuestion'

interface CitationChipProps {
  citation: Citation
  index: number
}

export function CitationChip({ citation, index }: CitationChipProps) {
  const label = citation.company
    ? `${citation.company}${citation.date ? ` · ${citation.date.slice(0, 7)}` : ''}`
    : citation.date?.slice(0, 7) ?? `Entrada ${index + 1}`

  return (
    <span
      title={citation.label}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium max-w-[160px] truncate"
      style={{
        background: 'var(--color-lilas-nevoa)',
        color: 'var(--color-primary)',
        border: '1px solid var(--color-primary)',
        opacity: 1,
      }}
    >
      <span className="shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        {index + 1}
      </span>
      <span className="truncate">{label}</span>
    </span>
  )
}
