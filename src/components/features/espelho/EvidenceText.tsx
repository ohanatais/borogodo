'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { EvidenceItem } from '@/types/mirror'
import { getEvidenceEntries } from '@/app/[locale]/espelho/actions'
import { toEvidenceItem } from '@/types/mirror'
import { truncate } from '@/lib/utils'

interface EvidenceEntry {
  id: string
  what_i_did: string
  role_title: string | null
  company: string | null
  entry_date: string | null
  created_at: string
}

interface EvidenceTextProps {
  evidence: EvidenceItem | unknown
}

function formatEntryMeta(entry: EvidenceEntry): string {
  const parts = [entry.role_title, entry.company].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : ''
}

export function EvidenceText({ evidence }: EvidenceTextProps) {
  const t = useTranslations('espelho.evidence')
  const ev = toEvidenceItem(evidence)
  const hasLinks = ev.entry_ids.length > 0

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<EvidenceEntry[]>([])
  const [fetched, setFetched] = useState(false)

  const handleToggle = async () => {
    if (!open && !fetched && !loading) {
      setLoading(true)
      try {
        const result = await getEvidenceEntries(ev.entry_ids)
        setEntries(result)
      } finally {
        setLoading(false)
        setFetched(true)
      }
    }
    setOpen((prev) => !prev)
  }

  return (
    <div>
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {ev.text}
      </p>

      {hasLinks && (
        <div className="mt-2">
          <button
            type="button"
            onClick={handleToggle}
            className="text-xs font-medium underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
          >
            {open ? t('collapse') : t('show', { count: ev.entry_ids.length })}
          </button>

          {open && (
            <div
              className="mt-2 rounded-lg border divide-y text-xs"
              style={{ borderColor: 'var(--border)', background: 'var(--color-lilas-nevoa)' }}
            >
              {loading ? (
                <p className="px-3 py-2" style={{ color: 'var(--muted-foreground)' }}>
                  {t('loading')}
                </p>
              ) : entries.length === 0 ? null : (
                entries.map((entry) => (
                  <div key={entry.id} className="px-3 py-2 space-y-0.5">
                    {formatEntryMeta(entry) && (
                      <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                        {formatEntryMeta(entry)}
                      </p>
                    )}
                    <p style={{ color: 'var(--muted-foreground)' }}>
                      {truncate(entry.what_i_did, 120)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
