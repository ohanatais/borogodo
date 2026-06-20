'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Wand2, HelpCircle, Check, X, BookOpen, Save } from 'lucide-react'
import type { PeriodRecapItem } from '@/lib/autoavaliacao/periodRecap'
import type { SentenceStemAnchors } from '@/lib/autoavaliacao/sentenceStems'
import type { AssistSection } from '@/lib/ai/content/assist'

/** Uma seção do andaime. `key` indexa o i18n (sections/stems); `api` é o parâmetro da rota de assist. */
interface SectionDef {
  key: 'entregas' | 'impacto' | 'evolucao' | 'pontosADesenvolver'
  api: AssistSection
}

type SectionKey = SectionDef['key']
type Sections = Record<SectionKey, string>

const EMPTY_SECTIONS: Sections = { entregas: '', impacto: '', evolucao: '', pontosADesenvolver: '' }

/** Heurística-espelho do assist (star_nudge) no cliente: evita um round-trip para um sinal trivial. */
function looksVague(text: string): boolean {
  if (text.trim().length < 12) return false
  return !/\d/.test(text) && !/(resultado|de\s.+\spara\s|aument|reduz|cresc|dobr|%|R\$)/i.test(text)
}

interface AssistCard {
  section: SectionKey
  kind: 'rephrase' | 'unblock'
  value: string
}

interface AssessmentEditorProps {
  recap: PeriodRecapItem[]
  stems: SentenceStemAnchors
  seedRef: string
}

/**
 * Cabine de escrita da autoavaliação (019, US1, T020). A pessoa ESCREVE por seções (andaime opcional);
 * a IA só ancora: reescreve com as palavras dela ou faz 1 pergunta para destravar — nunca preenche
 * sozinha, nunca dá nota. A trilha de evidências fica ao lado (colapsável no mobile). Salva como
 * rascunho autorado (`status='draft'`), isolado do espelho.
 */
export function AssessmentEditor({ recap, stems, seedRef }: AssessmentEditorProps) {
  const t = useTranslations('autoavaliacao')
  const locale = useLocale()
  // timeZone UTC: evita o off-by-one de datas date-only em fusos negativos (ver YearInFactsRecap).
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const trailDateFmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', timeZone: 'UTC' })
  const [sections, setSections] = useState<Sections>(EMPTY_SECTIONS)
  const [card, setCard] = useState<AssistCard | null>(null)
  const [busy, setBusy] = useState(false)
  const [trailOpen, setTrailOpen] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const sectionDefs: SectionDef[] = [
    { key: 'entregas', api: 'entregas' },
    { key: 'impacto', api: 'impacto' },
    { key: 'evolucao', api: 'evolucao' },
    { key: 'pontosADesenvolver', api: 'pontos_a_desenvolver' },
  ]

  function placeholderFor(def: SectionDef): string {
    // Só entregas tem âncora temporal (gramatical: "Em março de 2025, eu…"); sem registro, molde neutro.
    if (def.key === 'entregas') {
      return stems.entregasMonth
        ? t('stems.entregas', { anchor: monthFmt.format(new Date(stems.entregasMonth)) })
        : t('stems.entregasNeutro')
    }
    return t(`stems.${def.key}`)
  }

  function setSection(key: SectionKey, value: string) {
    setSections((prev) => ({ ...prev, [key]: value }))
    setSaveState('idle')
  }

  async function callAssist(def: SectionDef, kind: 'rephrase' | 'unblock') {
    setBusy(true)
    setCard(null)
    try {
      const res = await fetch('/api/autoavaliacao/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          kind === 'rephrase'
            ? { mode: 'rephrase', section: def.api, text: sections[def.key] }
            : { mode: 'unblock', section: def.api, seedRef }
        ),
      })
      if (!res.ok) {
        setCard({ section: def.key, kind, value: t('assist.failed') })
        return
      }
      const data = (await res.json()) as { suggestion?: string; question?: string }
      setCard({ section: def.key, kind, value: (kind === 'rephrase' ? data.suggestion : data.question) ?? t('assist.failed') })
    } catch {
      setCard({ section: def.key, kind, value: t('assist.failed') })
    } finally {
      setBusy(false)
    }
  }

  function acceptCard() {
    if (!card) return
    // rephrase substitui a frase; unblock vira o rascunho da seção (a pessoa edita depois).
    setSection(card.section, card.value)
    setCard(null)
  }

  function buildBody(): string {
    return sectionDefs
      .filter((d) => sections[d.key].trim())
      .map((d) => `${t(`sections.${d.key}`)}:\n${sections[d.key].trim()}`)
      .join('\n\n')
  }

  const hasContent = sectionDefs.some((d) => sections[d.key].trim())

  async function handleSave() {
    if (!hasContent) return
    setSaveState('saving')
    try {
      const res = await fetch('/api/content/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'self_assessment',
          seedType: 'period',
          seedRef,
          angle: '',
          body: buildBody(),
          status: 'draft',
          qa: {},
        }),
      })
      setSaveState(res.ok ? 'saved' : 'error')
    } catch {
      setSaveState('error')
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Coluna principal: a escrita da pessoa é a protagonista */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {sectionDefs.map((def) => (
          <section key={def.key} className="flex flex-col gap-2">
            <h3 className="text-lg" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--foreground)' }}>
              {t(`sections.${def.key}`)}
            </h3>
            <textarea
              value={sections[def.key]}
              onChange={(e) => setSection(def.key, e.target.value)}
              placeholder={placeholderFor(def)}
              rows={4}
              className="w-full rounded-xl border px-4 py-3 text-base resize-y focus:outline-none focus:ring-2"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />

            {/* Nudge STAR: só pergunta, nunca preenche */}
            {def.key === 'impacto' && looksVague(sections.impacto) && (
              <p className="text-xs" style={{ color: 'var(--color-accent-text)' }}>
                {t('assist.starNudge')}
              </p>
            )}

            {/* Ajudas opt-in da IA */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !sections[def.key].trim()}
                onClick={() => callAssist(def, 'rephrase')}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 min-h-[40px] rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-lilas-nevoa-text)' }}
              >
                <Wand2 size={13} aria-hidden="true" />
                {t('assist.rephrase')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => callAssist(def, 'unblock')}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 min-h-[40px] rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-lilas-nevoa-text)' }}
              >
                <HelpCircle size={13} aria-hidden="true" />
                {t('assist.unblock')}
              </button>
            </div>

            {/* Cartão de sugestão da IA: aceitar / rejeitar (verde-água = ancorado) */}
            {card?.section === def.key && (
              <div className="rounded-xl border p-3 flex flex-col gap-2" style={{ borderColor: 'var(--color-teal)', background: 'var(--card)' }}>
                {card.kind === 'unblock' && (
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {t('assist.unblockQuestionLabel')}
                  </span>
                )}
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {card.value}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={acceptCard}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 min-h-[40px] rounded-lg"
                    style={{ background: 'var(--color-teal)', color: 'var(--foreground)' }}
                  >
                    <Check size={13} aria-hidden="true" />
                    {t('assist.accept')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCard(null)}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 min-h-[40px] rounded-lg"
                    style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                  >
                    <X size={13} aria-hidden="true" />
                    {t('assist.reject')}
                  </button>
                </div>
              </div>
            )}
          </section>
        ))}

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!hasContent || saveState === 'saving'}
            onClick={handleSave}
            className="inline-flex items-center gap-2 text-base font-medium px-5 py-3 min-h-[48px] rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          >
            <Save size={16} aria-hidden="true" />
            {saveState === 'saving' ? t('editor.saving') : t('editor.save')}
          </button>
          {saveState === 'saved' && (
            <span className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--foreground)' }}>
              <Check size={15} aria-hidden="true" style={{ color: 'var(--color-teal)' }} />
              {t('editor.saved')}
            </span>
          )}
          {saveState === 'error' && (
            <span className="text-sm" style={{ color: 'var(--destructive)' }}>
              {t('editor.saveError')}
            </span>
          )}
        </div>
      </div>

      {/* Trilha de evidências: rail sticky no desktop, gaveta no mobile. Resumo curto (não repete o
          recap completo acima): data + uma linha por registro, como índice de consulta. */}
      {recap.length > 0 && (
        <aside className="lg:w-72 shrink-0 lg:sticky lg:top-6 lg:self-start">
          <button
            type="button"
            onClick={() => setTrailOpen((v) => !v)}
            aria-expanded={trailOpen}
            className="lg:hidden inline-flex items-center gap-1.5 text-sm px-3 py-2 min-h-[48px] rounded-lg"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            <BookOpen size={15} aria-hidden="true" />
            {t('editor.trailLabel')}
          </button>
          <div className={`${trailOpen ? 'block' : 'hidden'} lg:block mt-3 lg:mt-0 rounded-xl border p-4`} style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted-foreground)' }}>
              {t('editor.trailTitle')}
            </h4>
            <ul className="flex flex-col gap-3">
              {recap.map((item) => (
                <li key={item.sourceEntryId} className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                    {trailDateFmt.format(new Date(item.occurredAt))}
                  </span>
                  <span className="text-xs line-clamp-2" style={{ color: 'var(--foreground)' }}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  )
}
