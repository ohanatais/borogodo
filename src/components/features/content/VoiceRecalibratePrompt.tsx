'use client'

import { useState, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { Mic2 } from 'lucide-react'
import { AiLimitNotice } from '@/components/features/cost/AiLimitNotice'
import { parseAiLimit, type AiLimitInfo } from '@/lib/ai/cost/clientLimit'

interface VoiceRecalibratePromptProps {
  /**
   * Chave do sinal (o `lastFeedbackAt`) para lembrar a dispensa até chegar feedback novo: dispensar
   * guarda esta chave; quando o sinal muda (novo "não soa"), a sugestão volta a aparecer.
   */
  signalKey: string | null
}

type State = 'idle' | 'applying' | 'done' | 'error' | 'limited'

const DISMISS_KEY = 'borogodo:voice-recalibrate-dismissed'

// A dispensa persistida só muda por ação desta superfície; não há fonte externa para assinar.
const subscribeNoop = () => () => {}

function readDismissed(signalKey: string | null): boolean {
  if (signalKey === null) return false
  try {
    return window.localStorage.getItem(DISMISS_KEY) === signalKey
  } catch {
    return false
  }
}

function rememberDismissed(signalKey: string | null): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, signalKey ?? '')
  } catch {
    // Modo privado / storage indisponível: a dispensa vale só nesta sessão. Sem erro ao usuário.
  }
}

/**
 * Sugestão discreta de recalibrar a voz (US1). Aparece só quando a página já decidiu que há sinal
 * acumulado ("não soa" acima do limiar). "Afinar minha voz" aplica COM consentimento (POST apply:true);
 * "Agora não" dispensa e lembra a dispensa até chegar feedback novo. A voz nunca muda sozinha: esta
 * superfície é a única porta e exige o clique explícito.
 *
 * A dispensa persistida é lida via `useSyncExternalStore` (SSR-safe, sem setState em efeito): no
 * servidor é sempre "não dispensada"; no cliente reflete o localStorage sem mismatch de hidratação.
 */
export function VoiceRecalibratePrompt({ signalKey }: VoiceRecalibratePromptProps) {
  const t = useTranslations('presenca.voice.recalibrate')
  const persistedDismissed = useSyncExternalStore(
    subscribeNoop,
    () => readDismissed(signalKey),
    () => false
  )
  const [dismissedNow, setDismissedNow] = useState(false)
  const [state, setState] = useState<State>('idle')
  const [aiLimit, setAiLimit] = useState<AiLimitInfo | null>(null)

  function handleDismiss() {
    rememberDismissed(signalKey)
    setDismissedNow(true)
  }

  async function handleAccept() {
    setState('applying')
    try {
      const res = await fetch('/api/content/voice/recalibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply: true }),
      })
      if (!res.ok) {
        const limit = await parseAiLimit(res)
        if (limit) {
          setAiLimit(limit)
          setState('limited')
          return
        }
        setState('error')
        return
      }
      // Não precisa lembrar a dispensa aqui: ao recalibrar, o voice_profile.updatedAt avança e o gate
      // do servidor (shouldSuggestRecalibration) já não sugere de novo. Mostrar o "pronto" nesta sessão.
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (persistedDismissed || dismissedNow) return null

  return (
    <section
      aria-label={t('suggestion')}
      className="rounded-2xl border p-4 flex flex-col gap-3"
      style={{ borderColor: 'var(--color-primary)', background: 'var(--color-lilas-nevoa)' }}
    >
      <div className="flex items-start gap-2.5">
        <Mic2 size={18} aria-hidden="true" style={{ color: 'var(--color-primary)' }} className="shrink-0 mt-0.5" />
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          {state === 'done' ? t('done') : t('suggestion')}
        </p>
      </div>

      {state === 'limited' && aiLimit && (
        <AiLimitNotice info={aiLimit} onDismiss={() => setState('idle')} />
      )}

      {state !== 'done' && state !== 'limited' && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleAccept()}
            disabled={state === 'applying'}
            className="inline-flex items-center justify-center text-sm font-medium px-4 py-2 min-h-[48px] rounded-full transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          >
            {state === 'applying' ? t('applying') : t('accept')}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={state === 'applying'}
            className="inline-flex items-center justify-center text-sm px-4 py-2 min-h-[48px] rounded-full transition-opacity hover:opacity-80 disabled:opacity-60"
            style={{ color: 'var(--color-primary)', background: 'transparent' }}
          >
            {t('dismiss')}
          </button>
        </div>
      )}

      {state === 'error' && (
        <p role="status" aria-live="polite" className="text-xs" style={{ color: 'var(--destructive)' }}>
          {t('error')}
        </p>
      )}
    </section>
  )
}
