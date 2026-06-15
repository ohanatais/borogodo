'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mic2 } from 'lucide-react'

interface VoiceCalibrationProps {
  /** Chamado após salvar a voz com sucesso — a superfície regera refletindo o novo perfil. */
  onSaved: () => void
}

/**
 * Calibração de voz opcional e não-bloqueante (US1). Um affordance leve "afinar voz" abre o campo
 * para colar 1–2 amostras; salva via PUT /api/content/voice e dispara a regeneração. Nunca é etapa
 * obrigatória antes de gerar.
 */
export function VoiceCalibration({ onSaved }: VoiceCalibrationProps) {
  const t = useTranslations('presenca')
  const [open, setOpen] = useState(false)
  const [sampleA, setSampleA] = useState('')
  const [sampleB, setSampleB] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  async function handleSave() {
    const samples = [sampleA, sampleB].map((s) => s.trim()).filter((s) => s.length > 0)
    if (samples.length === 0) {
      setOpen(false)
      return
    }

    setSaving(true)
    setError(false)
    try {
      const res = await fetch('/api/content/voice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples }),
      })
      if (!res.ok) {
        setError(true)
        return
      }
      setOpen(false)
      onSaved()
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm min-h-[48px] transition-opacity hover:opacity-80"
        style={{ color: 'var(--color-accent-text)' }}
      >
        <Mic2 size={14} aria-hidden="true" />
        {t('calibration.open')}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl p-3 border" style={{ borderColor: 'var(--border)' }}>
      <label className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {t('calibration.hint')}
      </label>
      <textarea
        value={sampleA}
        onChange={(e) => setSampleA(e.target.value)}
        rows={2}
        className="text-sm rounded-lg p-2 border resize-none"
        style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        aria-label={`${t('calibration.hint')} 1`}
      />
      <textarea
        value={sampleB}
        onChange={(e) => setSampleB(e.target.value)}
        rows={2}
        className="text-sm rounded-lg p-2 border resize-none"
        style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        aria-label={`${t('calibration.hint')} 2`}
      />
      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--destructive)' }}>
          {t('errors.generic')}
        </p>
      )}
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="self-start inline-flex items-center justify-center text-sm font-medium px-3 py-1.5 min-h-[48px] rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        {saving ? t('generating') : t('calibration.save')}
      </button>
    </div>
  )
}
