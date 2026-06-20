'use client'

import { useTranslations } from 'next-intl'
import { ArrowLeft, FileText, MessageSquare } from 'lucide-react'
import { PREP_MOMENTS, type PrepMoment } from '@/lib/content/intentions'
import { openPresenca } from '@/components/features/content/presencaEvents'
import { openChatSheet } from '@/components/features/chat/ChatSheet'

interface PrepararMomentoProps {
  moment: PrepMoment
  /** Tema âncora da trajetória (seed da geração). `null` quando ainda não há Espelho. */
  themeRef: string | null
  onBack: () => void
}

/**
 * Bifurcação de um momento de preparação (017): "quero algo pronto agora" (gera um resumo de
 * impacto com o ângulo do momento) vs. "quero treinar conversando" (abre o chat enquadrado no
 * momento). O caminho "pronto" fica em destaque — nunca forçamos conversa antes de entregar valor.
 * Reusa os motores existentes via eventos (`openPresenca`/`openChatSheet`).
 */
export function PrepararMomento({ moment, themeRef, onBack }: PrepararMomentoProps) {
  const t = useTranslations('repertorio')
  const momentLabel = t(`moments.${moment}`)

  function handleReady() {
    if (!themeRef) return
    openPresenca({
      seedType: 'theme',
      seedRef: themeRef,
      seedSummary: momentLabel,
      formats: ['impact_summary'],
      angle: PREP_MOMENTS[moment].angleHint,
      moment,
    })
  }

  function handleTalk() {
    openChatSheet({ context: { type: 'preparacao', moment } })
  }

  return (
    <section className="flex flex-col gap-4" aria-label={momentLabel}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm min-h-[48px] px-2 rounded-lg transition-opacity hover:opacity-70"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {t('prepare.back')}
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          {momentLabel}
        </h3>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {t('prepare.heading')}
        </p>
      </div>

      {!themeRef && (
        <p className="text-sm rounded-lg p-3" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
          {t('prepare.noTheme')}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {/* Caminho em destaque: algo pronto agora */}
        <button
          type="button"
          onClick={handleReady}
          disabled={!themeRef}
          className="flex items-start gap-3 text-left rounded-xl p-4 min-h-[48px] transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          <FileText size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{t('prepare.ready')}</span>
            <span className="text-xs" style={{ opacity: 0.9 }}>{t('prepare.readyHint')}</span>
          </span>
        </button>

        {/* Caminho conversacional */}
        <button
          type="button"
          onClick={handleTalk}
          className="flex items-start gap-3 text-left rounded-xl p-4 min-h-[48px] border transition-opacity hover:opacity-80"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          <MessageSquare size={18} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{t('prepare.talk')}</span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{t('prepare.talkHint')}</span>
          </span>
        </button>
      </div>
    </section>
  )
}
