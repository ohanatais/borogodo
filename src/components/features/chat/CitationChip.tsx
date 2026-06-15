'use client'

import type { Citation } from '@/lib/ai/chat/answerCareerQuestion'

interface CitationChipProps {
  citation: Citation
  index: number
  count?: number
}

export function CitationChip({ citation, index, count }: CitationChipProps) {
  const year = citation.date?.slice(0, 4)
  const base = citation.company
    ? `${citation.company}${year ? ` · ${year}` : ''}`
    : year ?? `Entrada ${index + 1}`
  const label = count && count > 1 ? `${base} (${count})` : base

  return (
    <span
      title={citation.label}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        background: 'var(--color-lilas-nevoa)',
        color: 'var(--color-primary)',
      }}
    >
      <span
        className="shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        {index + 1}
      </span>
      <span>{label}</span>
    </span>
  )
}
