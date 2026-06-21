'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarCheck, Check, Send } from 'lucide-react'

interface ReviewCheckInProps {
  /** O compromisso (`commitmentQuestion`) do ciclo anterior — o que a pessoa volta para revisar. */
  commitment: string
}

type Phase = 'open' | 'saving' | 'done' | 'error' | 'dismissed'

/**
 * Check-in de revisão (019, US2 follow-up). Quando a data marcada chega, recebe a pessoa com o
 * COMPROMISSO anterior + "como foi?". A resposta vira um REGISTRO (rota /review-checkin → pipeline de
 * captura) e alimenta a próxima autoavaliação. Fecha o loop refletir → planejar → revisar.
 */
export function ReviewCheckIn({ commitment }: ReviewCheckInProps) {
  const t = useTranslations('autoavaliacao.reviewCheckIn')
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<Phase>('open')

  async function submit() {
    if (text.trim().length < 3) return
    setPhase('saving')
    try {
      const res = await fetch('/api/autoavaliacao/review-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      setPhase(res.ok ? 'done' : 'error')
    } catch {
      setPhase('error')
    }
  }

  if (phase === 'dismissed') return null

  if (phase === 'done') {
    return (
      <section role="status" className="rounded-2xl border p-6 flex items-start gap-3" style={{ borderColor: 'var(--color-teal)', background: 'var(--card)' }}>
        <Check size={20} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: 'var(--color-teal)' }} />
        <p className="text-base leading-relaxed" style={{ color: 'var(--foreground)' }}>{t('done')}</p>
      </section>
    )
  }

  const canSubmit = text.trim().length >= 3 && phase !== 'saving'

  return (
    <section className="rounded-2xl border p-6 flex flex-col gap-4" style={{ borderColor: 'var(--color-teal)', background: 'var(--color-lilas-nevoa)' }}>
      <div className="flex items-center gap-2">
        <CalendarCheck size={18} aria-hidden="true" style={{ color: 'var(--color-lilas-nevoa-text)' }} />
        <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-sans)', color: 'var(--foreground)' }}>
          {t('title')}
        </h2>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm" style={{ color: 'var(--color-lilas-nevoa-text)' }}>{t('intro')}</p>
        <p className="text-base leading-relaxed italic" style={{ color: 'var(--foreground)' }}>“{commitment}”</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-base font-medium" style={{ color: 'var(--foreground)' }}>{t('prompt')}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('placeholder')}
          rows={4}
          className="w-full rounded-xl border px-4 py-3 text-base leading-relaxed resize-y transition-shadow focus:outline-none focus:shadow-[0_0_0_2px_var(--color-primary)]"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      </label>

      {phase === 'error' && (
        <p role="alert" className="text-sm" style={{ color: 'var(--destructive)' }}>{t('error')}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 text-base font-medium px-5 py-3 min-h-[48px] rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          <Send size={16} aria-hidden="true" />
          {phase === 'saving' ? t('submitting') : t('submit')}
        </button>
        <button
          type="button"
          onClick={() => setPhase('dismissed')}
          className="inline-flex items-center text-sm px-4 py-2.5 min-h-[48px] rounded-xl transition-opacity hover:opacity-80"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {t('dismiss')}
        </button>
      </div>
    </section>
  )
}
