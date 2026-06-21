'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Pencil } from 'lucide-react'
import type { DraftFormat, DraftVariant, SeedType, VoiceFeedback } from '@/types/content'
import type { PrepMoment } from '@/lib/content/intentions'
import { CopyButton } from './CopyButton'
import { createDraft, patchDraft } from './draftsClient'
import { notifyDraftUpdated, notifyDraftCreated } from './presencaEvents'

/** Evidência base, necessária para persistir o rascunho escolhido (US4). */
export interface DraftSeed {
  seedType: SeedType
  seedRef: string
}

interface DraftCardProps {
  variant: DraftVariant
  index: number
  format: DraftFormat
  seed: DraftSeed
  /**
   * Quando presente (modo "retomar" da 014), o card edita um rascunho já existente: editar/copiar
   * fazem PATCH neste id em vez de criar uma linha nova. Ausente = card de geração fresca (013).
   */
  existingDraftId?: string
  /** Momento de preparação que originou o rascunho (017): gravado em `qa.moment` ao salvar. */
  moment?: PrepMoment
}

const FORMAT_LABEL_KEY: Record<DraftFormat, string> = {
  post: 'formats.post',
  impact_summary: 'formats.impactSummary',
  mini_bio: 'formats.miniBio',
}

/**
 * Card de um rascunho gerado. US1 entrega a apresentação (ângulo em Fraunces itálico + corpo em
 * Geist). US3 adiciona edição inline e cópia; US4 persiste o rascunho escolhido (`generated` →
 * `edited` → `copied`) e o feedback "soa como você?" — tudo escopado ao próprio usuário pela rota.
 * A persistência é resiliente: uma falha mantém o texto na tela e só sinaliza discretamente.
 */
export function DraftCard({ variant, index, format, seed, existingDraftId, moment }: DraftCardProps) {
  const t = useTranslations('presenca')
  const [body, setBody] = useState(variant.body)
  const [isEditing, setIsEditing] = useState(false)
  const [voiceFeedback, setVoiceFeedback] = useState<VoiceFeedback | null>(null)
  const [saveError, setSaveError] = useState(false)

  // Em "retomar", já partimos do id existente: ensureSaved devolve-o sem criar nada novo.
  const draftIdRef = useRef<string | null>(existingDraftId ?? null)
  const savePromiseRef = useRef<Promise<string | null> | null>(null)
  const editedRef = useRef(false)
  const labelId = `draft-${index}`

  /**
   * Garante que o rascunho existe no banco; cria na primeira ação que o compromete. Dedupe de
   * criações concorrentes (ex.: blur do editor + copiar no mesmo gesto) para nunca gravar duplicado.
   */
  async function ensureSaved(currentBody: string): Promise<string | null> {
    if (draftIdRef.current) return draftIdRef.current
    if (savePromiseRef.current) return savePromiseRef.current

    const pending = (async () => {
      const created = await createDraft({
        format,
        seedType: seed.seedType,
        seedRef: seed.seedRef,
        angle: variant.angle,
        body: currentBody,
        status: editedRef.current ? 'edited' : 'generated',
        qa: { angle: variant.angle, evidenceRefs: variant.evidenceRefs, ...(moment ? { moment } : {}) },
      })

      if (!created) {
        setSaveError(true)
        savePromiseRef.current = null // permite nova tentativa após falha
        return null
      }
      draftIdRef.current = created.id
      setSaveError(false)
      notifyDraftCreated(created.id)
      return created.id
    })()

    savePromiseRef.current = pending
    return pending
  }

  async function handleEditDone() {
    setIsEditing(false)
    if (body === variant.body && !editedRef.current) return

    editedRef.current = true
    const id = draftIdRef.current
    if (!id) {
      await ensureSaved(body)
      return
    }
    const updated = await patchDraft(id, { body, status: 'edited' })
    if (!updated) {
      setSaveError(true)
      return
    }
    notifyDraftUpdated({ id, body, status: 'edited' })
  }

  async function handleCopied() {
    const id = await ensureSaved(body)
    if (!id) return
    const updated = await patchDraft(id, { status: 'copied' })
    if (!updated) {
      setSaveError(true)
      return
    }
    notifyDraftUpdated({ id, status: 'copied' })
  }

  /** "Soa como você?" — persiste o sinal de voz sem regerar nada no v1 (FR-016). */
  async function handleVoice(feedback: VoiceFeedback) {
    setVoiceFeedback(feedback)
    const id = await ensureSaved(body)
    if (!id) return
    const updated = await patchDraft(id, { voiceFeedback: feedback })
    if (!updated) setSaveError(true)
  }

  return (
    <article
      data-testid="draft-card"
      aria-labelledby={labelId}
      className="flex flex-col gap-3 rounded-2xl p-4 border"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <p id={labelId} className="sr-only">
        {`${t(FORMAT_LABEL_KEY[format])} ${index + 1}`}
      </p>

      {variant.angle && (
        <p
          className="text-sm italic"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
        >
          {variant.angle}
        </p>
      )}

      {isEditing ? (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={() => void handleEditDone()}
          rows={Math.max(4, body.split('\n').length + 1)}
          aria-label={`${t(FORMAT_LABEL_KEY[format])} ${index + 1}`}
          autoFocus
          className="text-base leading-relaxed rounded-lg p-2 border resize-y"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      ) : (
        <p className="text-base whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--foreground)' }}>
          {body}
        </p>
      )}

      {/* Refino: editar, copiar e o sinal de voz */}
      <div className="flex flex-wrap items-center gap-2">
        {isEditing ? (
          <button
            type="button"
            onClick={() => void handleEditDone()}
            className="inline-flex items-center justify-center text-sm font-medium px-3 py-2 min-h-[48px] rounded-lg transition-opacity hover:opacity-80"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            {t('editDone')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 min-h-[48px] rounded-lg transition-opacity hover:opacity-80"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            <Pencil size={14} aria-hidden="true" />
            {t('edit')}
          </button>
        )}

        <CopyButton text={body} onCopied={() => void handleCopied()} />
      </div>

      {/* "Soa como você?" — sinal persistido para a calibração de voz (015) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t('voice.prompt')}
        </span>
        {(['soa', 'nao_soa'] as const).map((fb) => {
          const active = voiceFeedback === fb
          return (
            <button
              key={fb}
              type="button"
              onClick={() => void handleVoice(fb)}
              aria-pressed={active}
              className="inline-flex items-center justify-center text-sm px-3 py-1.5 min-h-[48px] rounded-full border transition-colors"
              style={{
                background: active ? 'var(--color-lilas-nevoa)' : 'var(--card)',
                borderColor: active ? 'var(--color-primary)' : 'var(--border)',
                color: active ? 'var(--color-primary)' : 'var(--muted-foreground)',
                fontWeight: active ? 600 : 400,
              }}
            >
              {fb === 'soa' ? t('voice.yes') : t('voice.no')}
            </button>
          )
        })}
      </div>

      {saveError && (
        <p role="status" aria-live="polite" className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {t('errors.save')}
        </p>
      )}
    </article>
  )
}
