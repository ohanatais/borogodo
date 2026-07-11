'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Check, CalendarClock, Pencil, RefreshCw, X } from 'lucide-react'
import type { ForwardStep } from '@/types/content'
import { AiLimitNotice } from '@/components/features/cost/AiLimitNotice'
import { parseAiLimit, type AiLimitInfo } from '@/lib/ai/cost/clientLimit'

interface ForwardStepOfferProps {
  /** O draft da autoavaliação já salva — insumo do passo-pra-frente. */
  draftId: string
  /** Plano já gerado (reabertura): mostra ele direto, em vez da oferta de um novo. */
  initialPlan?: ForwardStep
}

type Phase = 'offer' | 'generating' | 'done' | 'error' | 'limited' | 'declined'

/** Âncora para o banner de "próxima revisão" rolar até o plano ao reabrir a autoavaliação. */
const ANCHOR_ID = 'passo-pra-frente'

/**
 * Passo-pra-frente (019, US2, T030). UMA oferta opcional, in-flow, ancorada no que a pessoa ESCREVEU.
 * Recusar = some sem nag (gatilho ético). Aceitar gera o plano (GROW + 70-20-10); definir a data de
 * revisão grava a recorrência (o único gatilho do convite de painel).
 */
export function ForwardStepOffer({ draftId, initialPlan }: ForwardStepOfferProps) {
  const t = useTranslations('autoavaliacao.forwardStep')
  const [phase, setPhase] = useState<Phase>(initialPlan ? 'done' : 'offer')
  const [plan, setPlan] = useState<ForwardStep | null>(initialPlan ?? null)
  const [aiLimit, setAiLimit] = useState<AiLimitInfo | null>(null)
  const [reviewDate, setReviewDate] = useState('')
  const [dateSaved, setDateSaved] = useState(false)
  // Revisão é compromisso futuro: o input só aceita de amanhã em diante. Calculado uma vez (puro no render).
  const [minReviewDate] = useState(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10))

  // Rola até o plano quando a reabertura veio do banner "próxima revisão" (#passo-pra-frente).
  useEffect(() => {
    if (window.location.hash !== `#${ANCHOR_ID}`) return
    document.getElementById(ANCHOR_ID)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [])
  /** Edição inline do plano: a pessoa pode refinar com as próprias palavras. */
  const [editing, setEditing] = useState(false)
  const [draftPlan, setDraftPlan] = useState({ area: '', experienceAction: '', commitmentQuestion: '' })

  async function generate() {
    setPhase('generating')
    try {
      const res = await fetch('/api/autoavaliacao/forward-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, kind: 'action_plan' }),
      })
      if (!res.ok) {
        const limit = await parseAiLimit(res)
        if (limit) {
          setAiLimit(limit)
          setPhase('limited')
          return
        }
        setPhase('error')
        return
      }
      setPlan((await res.json()) as ForwardStep)
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }

  async function saveReviewDate() {
    if (!reviewDate) return
    try {
      const res = await fetch('/api/autoavaliacao/review-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anchor: reviewDate }),
      })
      if (res.ok) setDateSaved(true)
    } catch {
      // Silencioso: marcar a revisão é opcional; o plano já está salvo no draft.
    }
  }

  function startEdit() {
    if (!plan?.actionPlan) return
    setDraftPlan(plan.actionPlan)
    setEditing(true)
  }

  async function savePlan() {
    if (!plan) return
    try {
      const res = await fetch('/api/autoavaliacao/forward-step', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, plan: { ...draftPlan, anchoredOn: plan.anchoredOn } }),
      })
      if (res.ok) {
        setPlan((await res.json()) as ForwardStep)
        setEditing(false)
      }
    } catch {
      // Silencioso: o plano anterior continua válido.
    }
  }

  if (phase === 'declined') return null

  if (phase === 'offer') {
    return (
      <section id={ANCHOR_ID} className="scroll-mt-20 rounded-2xl px-5 py-5" style={{ background: 'var(--color-lilas-nevoa)' }}>
        <p className="text-base font-medium" style={{ color: 'var(--foreground)' }}>
          {t('offer')}
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={generate}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 min-h-[48px] rounded-xl transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          >
            <Sparkles size={16} aria-hidden="true" />
            {t('accept')}
          </button>
          <button
            type="button"
            onClick={() => setPhase('declined')}
            className="inline-flex items-center text-sm px-4 py-2.5 min-h-[48px] rounded-xl transition-opacity hover:opacity-80"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {t('decline')}
          </button>
        </div>
      </section>
    )
  }

  if (phase === 'generating') {
    return (
      <section className="rounded-2xl px-5 py-5" style={{ background: 'var(--color-lilas-nevoa)' }}>
        <p className="text-sm" style={{ color: 'var(--color-lilas-nevoa-text)' }}>{t('generating')}</p>
      </section>
    )
  }

  if (phase === 'limited' && aiLimit) {
    return (
      <section id={ANCHOR_ID} className="scroll-mt-20">
        <AiLimitNotice info={aiLimit} onDismiss={() => setPhase('offer')} />
      </section>
    )
  }

  if (phase === 'error') {
    return (
      <section className="rounded-2xl px-5 py-5" style={{ background: 'var(--color-lilas-nevoa)' }}>
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>{t('failed')}</p>
        <button
          type="button"
          onClick={generate}
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 min-h-[48px] rounded-xl"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          <Sparkles size={15} aria-hidden="true" />
          {t('accept')}
        </button>
      </section>
    )
  }

  const action = plan?.actionPlan
  return (
    <section id={ANCHOR_ID} className="scroll-mt-20 rounded-2xl border p-6 flex flex-col gap-5" style={{ borderColor: 'var(--color-teal)', background: 'var(--card)' }}>
      {editing ? (
        <div className="flex flex-col gap-4">
          <EditField label={t('areaLabel')} value={draftPlan.area} rows={2} onChange={(v) => setDraftPlan((p) => ({ ...p, area: v }))} />
          <EditField label={t('actionLabel')} value={draftPlan.experienceAction} rows={3} onChange={(v) => setDraftPlan((p) => ({ ...p, experienceAction: v }))} />
          <EditField label={t('commitmentLabel')} value={draftPlan.commitmentQuestion} rows={2} onChange={(v) => setDraftPlan((p) => ({ ...p, commitmentQuestion: v }))} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={savePlan}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 min-h-[44px] rounded-lg transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-teal)', color: 'var(--foreground)' }}
            >
              <Check size={14} aria-hidden="true" />
              {t('savePlan')}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 min-h-[44px] rounded-lg transition-opacity hover:opacity-80"
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              <X size={14} aria-hidden="true" />
              {t('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {action && (
            <div className="flex flex-col gap-4">
              <Field label={t('areaLabel')} value={action.area} />
              <Field label={t('actionLabel')} value={action.experienceAction} />
              <Field label={t('commitmentLabel')} value={action.commitmentQuestion} />
            </div>
          )}

          {plan && plan.anchoredOn.length > 0 && (
            <p className="text-xs italic" style={{ color: 'var(--muted-foreground)' }}>
              {t('anchoredOn')}: {plan.anchoredOn.map((q) => `“${q}”`).join(' ')}
            </p>
          )}

          {/* Controle: a pessoa pode refinar com as próprias palavras ou gerar outra versão. */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 min-h-[40px] rounded-lg transition-opacity hover:opacity-80"
              style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-lilas-nevoa-text)' }}
            >
              <Pencil size={13} aria-hidden="true" />
              {t('edit')}
            </button>
            <button
              type="button"
              onClick={generate}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 min-h-[40px] rounded-lg transition-opacity hover:opacity-80"
              style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-lilas-nevoa-text)' }}
            >
              <RefreshCw size={13} aria-hidden="true" />
              {t('regenerate')}
            </button>
          </div>
        </>
      )}

      {/* Gatilho ético: a recorrência só nasce quando A PESSOA marca a data. */}
      <div className="flex flex-col gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        {dateSaved ? (
          <p className="inline-flex items-center gap-1.5 text-sm pt-3" style={{ color: 'var(--foreground)' }}>
            <Check size={15} aria-hidden="true" style={{ color: 'var(--color-teal)' }} />
            {t('savedDate')}
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3 pt-3">
            <label className="flex flex-col gap-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {t('reviewDateLabel')}
              <input
                type="date"
                value={reviewDate}
                min={minReviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="min-h-[48px] rounded-lg border px-3 text-base"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </label>
            <button
              type="button"
              onClick={saveReviewDate}
              disabled={!reviewDate}
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 min-h-[48px] rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
            >
              <CalendarClock size={15} aria-hidden="true" />
              {t('saveDate')}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </span>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{value}</p>
    </div>
  )
}

function EditField({
  label,
  value,
  rows,
  onChange,
}: {
  label: string
  value: string
  rows: number
  onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border px-3 py-2 text-sm leading-relaxed resize-y transition-shadow focus:outline-none focus:shadow-[0_0_0_2px_var(--color-primary)]"
        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
      />
    </label>
  )
}
