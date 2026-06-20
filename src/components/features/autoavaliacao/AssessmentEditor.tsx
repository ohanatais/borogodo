'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Wand2, HelpCircle, Check, X, Save } from 'lucide-react'
import type { SentenceStemAnchors } from '@/lib/autoavaliacao/sentenceStems'
import type { AssistSection } from '@/lib/ai/content/assist'
import { ForwardStepOffer } from './ForwardStepOffer'

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

/**
 * Cartão de ajuda da IA. `rephrase`: `value` é a reescrita, "Usar" insere ela. `unblock`: `value` é a
 * PERGUNTA (guia, não conteúdo) — a pessoa escreve a resposta em `answer`, e "Usar" insere a RESPOSTA.
 */
interface AssistCard {
  section: SectionKey
  kind: 'rephrase' | 'unblock'
  value: string
}

interface AssessmentEditorProps {
  stems: SentenceStemAnchors
  seedRef: string
}

/**
 * Cabine de escrita da autoavaliação (019, US1, T020). A pessoa ESCREVE por seções (andaime opcional);
 * a IA só ancora: reescreve com as palavras dela, ou faz 1 pergunta para destravar (cuja RESPOSTA, que a
 * pessoa escreve, vira o rascunho) — nunca preenche sozinha, nunca dá nota. Salva como rascunho autorado
 * (`status='draft'`), isolado do espelho.
 */
export function AssessmentEditor({ stems, seedRef }: AssessmentEditorProps) {
  const t = useTranslations('autoavaliacao')
  const locale = useLocale()
  // timeZone UTC: evita o off-by-one de datas date-only em fusos negativos (ver YearInFactsRecap).
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const [sections, setSections] = useState<Sections>(EMPTY_SECTIONS)
  const [card, setCard] = useState<AssistCard | null>(null)
  /** Resposta da pessoa à pergunta do unblock (vira o rascunho ao "Usar"). */
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  /** Id da autoavaliação salva — habilita a oferta do passo-pra-frente (US2). */
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null)

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

  function closeCard() {
    setCard(null)
    setAnswer('')
  }

  async function callAssist(def: SectionDef, kind: 'rephrase' | 'unblock') {
    setBusy(true)
    closeCard()
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

  /** Insere o texto na seção: substitui (rephrase) ou acrescenta ao que já houver (unblock). */
  function applyToSection(key: SectionKey, text: string, append: boolean) {
    const current = sections[key].trim()
    setSection(key, append && current ? `${current}\n${text}` : text)
  }

  function acceptCard() {
    if (!card) return
    if (card.kind === 'rephrase') {
      applyToSection(card.section, card.value, false)
    } else if (answer.trim()) {
      // A RESPOSTA da pessoa vira o rascunho — nunca a pergunta da IA.
      applyToSection(card.section, answer.trim(), true)
    }
    closeCard()
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
      if (res.ok) {
        const data = (await res.json()) as { draft?: { id: string } }
        setSaveState('saved')
        if (data.draft?.id) setSavedDraftId(data.draft.id)
      } else {
        setSaveState('error')
      }
    } catch {
      setSaveState('error')
    }
  }

  const canAccept = card?.kind === 'rephrase' || !!answer.trim()

  return (
    <div className="flex flex-col gap-9">
      {sectionDefs.map((def) => (
        <section key={def.key} className="flex flex-col gap-2.5">
          {/* Rótulo de seção = nível "Title" (Geist 600), distinto dos headings Fraunces acima —
              desachata a hierarquia. Sobrescreve o Fraunces global de h3. */}
          <h3 className="text-[1.0625rem] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-sans)', color: 'var(--foreground)' }}>
            {t(`sections.${def.key}`)}
          </h3>
          <textarea
            value={sections[def.key]}
            onChange={(e) => setSection(def.key, e.target.value)}
            placeholder={placeholderFor(def)}
            rows={4}
            className="w-full rounded-xl border px-4 py-3 text-base leading-relaxed resize-y transition-shadow focus:outline-none focus:shadow-[0_0_0_2px_var(--color-primary)]"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
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

          {/* Cartão da IA (verde-água = ancorado). rephrase: sugestão + Usar/Descartar.
              unblock: pergunta-guia + campo de RESPOSTA da pessoa (a resposta vira o rascunho). */}
          {card?.section === def.key && (
            <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: 'var(--color-teal)', background: 'var(--card)' }}>
              {card.kind === 'rephrase' ? (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                  {card.value}
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--foreground)' }}>
                    {card.value}
                  </p>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {t('assist.unblockAnswerLabel')}
                    </span>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder={t('assist.unblockAnswerPlaceholder')}
                      rows={3}
                      autoFocus
                      className="w-full rounded-lg border px-3 py-2 text-sm leading-relaxed resize-y transition-shadow focus:outline-none focus:shadow-[0_0_0_2px_var(--color-primary)]"
                      style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </label>
                </>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={acceptCard}
                  disabled={!canAccept}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 min-h-[40px] rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'var(--color-teal)', color: 'var(--foreground)' }}
                >
                  <Check size={13} aria-hidden="true" />
                  {card.kind === 'unblock' ? t('assist.useAnswer') : t('assist.accept')}
                </button>
                <button
                  type="button"
                  onClick={closeCard}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 min-h-[40px] rounded-lg transition-opacity hover:opacity-80"
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

      {/* Passo-pra-frente (US2): oferta única após salvar, ancorada no que a pessoa escreveu. */}
      {savedDraftId && <ForwardStepOffer draftId={savedDraftId} />}
    </div>
  )
}
