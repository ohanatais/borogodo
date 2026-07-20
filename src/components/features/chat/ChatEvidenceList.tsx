'use client'

import Link from 'next/link'
import { ChevronDown, ExternalLink, ImageIcon } from 'lucide-react'
import type { Citation } from '@/lib/ai/chat/answerCareerQuestion'
import type { PrepMoment } from '@/lib/content/intentions'
import { trackPreparationEvent } from '@/lib/preparation/trackPreparationEvent'

export function ChatEvidenceList({ citations, moment }: { citations: Citation[]; moment?: PrepMoment }) {
  if (citations.length === 0) return null
  return (
    <div className="mt-2 w-full space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Evidências usadas</p>
      {citations.map((citation) => (
        <details key={citation.entryId} className="group rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <summary className="flex cursor-pointer list-none items-start gap-2">
            <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{citation.label}</span>
            <ChevronDown size={16} aria-hidden="true" className="mt-0.5 shrink-0 transition-transform group-open:rotate-180" style={{ color: 'var(--muted-foreground)' }} />
          </summary>
          {(citation.company || citation.date || citation.metric || citation.impact) && <div className="mt-3 space-y-2 text-xs leading-relaxed">
            {(citation.company || citation.date) && <p style={{ color: 'var(--muted-foreground)' }}>{[citation.company, citation.date ? new Date(citation.date).toLocaleDateString('pt-BR') : null].filter(Boolean).join(' · ')}</p>}
            {citation.metric && <p><strong>Métrica:</strong> {citation.metric}</p>}
            {citation.impact && <p><strong>Impacto:</strong> {citation.impact}</p>}
          </div>}
          {citation.proofs.length > 0 && <div className="mt-2 flex flex-wrap gap-2">
            {citation.proofs.map((proof, index) => proof.type === 'image' ? (
              <a key={`${proof.value}-${index}`} href={proof.value} target="_blank" rel="noreferrer" onClick={() => trackPreparationEvent('evidence_opened', moment, { kindImage: true })}
                className="group relative h-16 w-24 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proof.value} alt={proof.label ?? 'Evidência visual'} className="h-full w-full object-cover" />
                <ImageIcon size={14} className="absolute bottom-1 right-1 text-white drop-shadow" aria-hidden="true" />
              </a>
            ) : (
              <a key={`${proof.value}-${index}`} href={proof.value} target="_blank" rel="noreferrer" onClick={() => trackPreparationEvent('evidence_opened', moment, { kindUrl: true })}
                className="inline-flex min-h-12 items-center gap-1 rounded-full border px-3 text-xs" style={{ color: 'var(--color-primary)', borderColor: 'var(--border)' }}>
                <ExternalLink size={12} aria-hidden="true" />{proof.label ?? 'Abrir link'}
              </a>
            ))}
          </div>}
          <Link href={`/registros?entry=${citation.entryId}#registro-${citation.entryId}`} target="_blank" rel="noreferrer"
            onClick={() => trackPreparationEvent('evidence_opened', moment, { kindRecord: true })}
            className="mt-3 inline-flex min-h-12 items-center gap-1 text-xs font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
            <ExternalLink size={13} aria-hidden="true" /> Abrir registro em nova aba
          </Link>
        </details>
      ))}
    </div>
  )
}
