'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Paperclip, Plus, ExternalLink, Link as LinkIcon } from 'lucide-react'
import type { EvidenceItem } from '@/lib/historico/getHistoricoData'

interface EvidenceSectionProps {
  entryId: string
  initial: EvidenceItem[]
}

type AddMode = 'url' | 'image' | null

function safeHostname(url: string): string {
  try { return new URL(url).hostname } catch { return url.slice(0, 30) }
}

export function EvidenceSection({ entryId, initial }: EvidenceSectionProps) {
  const router = useRouter()
  const [evidences, setEvidences] = useState<EvidenceItem[]>(initial)
  const [addMode, setAddMode] = useState<AddMode>(null)
  const [urlInput, setUrlInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitUrl() {
    const value = urlInput.trim()
    if (!value || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/entries/${entryId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'url',
          value,
          ...(labelInput.trim() ? { label: labelInput.trim() } : {}),
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { evidences?: EvidenceItem[]; error?: string }
      if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); return }
      setEvidences(json.evidences ?? evidences)
      setUrlInput('')
      setLabelInput('')
      setAddMode(null)
      router.refresh()
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  async function submitImage(file: File) {
    setSaving(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/entries/${entryId}/evidence`, { method: 'POST', body: formData })
      const json = (await res.json().catch(() => ({}))) as { evidences?: EvidenceItem[]; error?: string }
      if (!res.ok) { setError(json.error ?? 'Erro ao enviar'); return }
      setEvidences(json.evidences ?? evidences)
      setAddMode(null)
      router.refresh()
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pt-1 space-y-2">
      {/* Image thumbnails — max 3 visible, +N overflow */}
      {(() => {
        const images = evidences.filter((ev) => ev.type === 'image')
        if (images.length === 0) return null
        const MAX_PREVIEW = 3
        const visible = images.slice(0, MAX_PREVIEW)
        const overflow = images.length - MAX_PREVIEW
        return (
          <div className="flex gap-2">
            {visible.map((ev, i) => (
              <a
                key={i}
                href={ev.value}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={ev.label || 'Abrir imagem'}
                className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 block transition-opacity hover:opacity-80"
                style={{ border: '1px solid var(--border)' }}
              >
                <img
                  src={ev.value}
                  alt={ev.label || 'Evidência'}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
            {overflow > 0 && (
              <a
                href={images[MAX_PREVIEW]?.value}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ver mais ${overflow} imagem${overflow > 1 ? 'ns' : ''}`}
                className="w-16 h-16 rounded-lg flex items-center justify-center text-xs font-medium shrink-0 transition-opacity hover:opacity-80"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
              >
                +{overflow}
              </a>
            )}
          </div>
        )
      })()}

      {/* URL chips */}
      {evidences.some((ev) => ev.type === 'url') && (
        <div className="flex flex-wrap gap-1.5">
          {evidences
            .filter((ev) => ev.type === 'url')
            .map((ev, i) => (
              <a
                key={i}
                href={ev.value}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-opacity hover:opacity-70"
                style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-primary)' }}
              >
                <LinkIcon size={10} />
                <span>{ev.label || safeHostname(ev.value)}</span>
                <ExternalLink size={9} />
              </a>
            ))}
        </div>
      )}

      {/* URL add form */}
      {addMode === 'url' && (
        <div className="space-y-1.5">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void submitUrl()}
            placeholder="https://..."
            autoFocus
            className="w-full text-xs px-2.5 py-1.5 rounded-lg outline-none"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Legenda (opcional)"
            className="w-full text-xs px-2.5 py-1.5 rounded-lg outline-none"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => void submitUrl()}
              disabled={!urlInput.trim() || saving}
              className="text-xs px-3 py-1 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
            >
              {saving ? '…' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => { setAddMode(null); setUrlInput(''); setLabelInput('') }}
              className="text-xs px-3 py-1 rounded-lg"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Image add form */}
      {addMode === 'image' && (
        <div className="space-y-1">
          <label
            className="flex items-center justify-center w-full text-xs px-3 py-3 rounded-lg cursor-pointer"
            style={{ border: '2px dashed var(--border)', color: 'var(--muted-foreground)' }}
          >
            {saving ? 'Enviando…' : 'Clique para selecionar imagem'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={saving}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void submitImage(f) }}
            />
          </label>
          <button
            type="button"
            onClick={() => setAddMode(null)}
            className="text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Cancelar
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: 'var(--destructive)' }}>{error}</p>
      )}

      {/* Trigger row */}
      {!addMode && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <Paperclip size={11} />
            Evidências
          </span>
          <button
            type="button"
            onClick={() => setAddMode('url')}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
          >
            <Plus size={9} />
            Link
          </button>
          <button
            type="button"
            onClick={() => setAddMode('image')}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
          >
            <Plus size={9} />
            Imagem
          </button>
        </div>
      )}
    </div>
  )
}
