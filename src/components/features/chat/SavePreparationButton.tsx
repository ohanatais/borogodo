'use client'

import { useState } from 'react'
import { Bookmark, Check } from 'lucide-react'
import type { PrepMoment } from '@/lib/content/intentions'
import { trackPreparationEvent } from '@/lib/preparation/trackPreparationEvent'

export function SavePreparationButton({ moment, body, evidenceEntryIds }: { moment: PrepMoment; body: string; evidenceEntryIds: string[] }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  async function save() {
    setState('saving')
    try {
      const response = await fetch('/api/preparations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moment, body, evidenceEntryIds }) })
      if (!response.ok) return setState('error')
      setState('saved')
      trackPreparationEvent('preparation_saved', moment, { evidenceCount: evidenceEntryIds.length })
      window.dispatchEvent(new CustomEvent('borogodo:preparation-saved'))
    } catch {
      setState('error')
    }
  }
  return <button type="button" onClick={() => void save()} disabled={state === 'saving' || state === 'saved'}
    className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white disabled:opacity-70" style={{ background: 'var(--color-primary)' }}>
    {state === 'saved' ? <Check size={13} /> : <Bookmark size={13} />}
    {state === 'saving' ? 'Salvando…' : state === 'saved' ? 'Resposta salva' : state === 'error' ? 'Tentar salvar de novo' : 'Salvar esta resposta'}
  </button>
}
