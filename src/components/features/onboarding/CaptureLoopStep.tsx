'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { Reflection } from '@/types/capture'
import type { Mirror } from '@/types/mirror'

type LoadingPhase = 'reading' | 'generating'
const LONG_WAIT_AFTER_MS = 20_000

type LoopPhase =
  | { phase: 'idle'; prompt: string }
  | { phase: 'reading' }
  | { phase: 'reflecting'; reflection: Reflection }
  | { phase: 'generating' }
  | { phase: 'revealed'; mirror: Mirror }
  | { phase: 'error'; message: string }

export function CaptureLoopStep() {
  const t = useTranslations('bemvindo.loop')
  const router = useRouter()
  const [loopState, setLoopState] = useState<LoopPhase>({
    phase: 'idle',
    prompt: t('promptInicial'),
  })
  const [msgIndex, setMsgIndex] = useState(0)
  const [waitMs, setWaitMs] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadingPhases: LoadingPhase[] = ['reading', 'generating']
  const currentPhase = loadingPhases.includes(loopState.phase as LoadingPhase)
    ? (loopState.phase as LoadingPhase)
    : null

  useEffect(() => {
    if (!currentPhase) return
    const startedAt = Date.now()
    const timer = setInterval(() => setWaitMs(Date.now() - startedAt), 1000)
    const waitReset = setTimeout(() => setWaitMs(0), 0)
    const reset = setTimeout(() => setMsgIndex(0), 0)
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % 3), 3000)
    return () => { clearTimeout(waitReset); clearTimeout(reset); clearInterval(id); clearInterval(timer) }
  }, [currentPhase])

  const loadingMessages = currentPhase === 'reading'
    ? [t('reading1'), t('reading2'), t('reading3')]
    : [t('generating1'), t('generating2'), t('generating3')]
  const isLongWait = waitMs >= LONG_WAIT_AFTER_MS

  async function handleCapture(formData: FormData) {
    setLoopState({ phase: 'reading' })

    try {
      const res = await fetch('/api/capture', { method: 'POST', body: formData })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setLoopState({ phase: 'error', message: body.error ?? t('errorGeneric') })
        return
      }
      const data = (await res.json()) as {
        entries: Array<{ id: string }>
        reflection: Reflection | null
      }

      if (!data.reflection) {
        await generateMirror()
        return
      }

      setLoopState({ phase: 'reflecting', reflection: data.reflection })

      setTimeout(() => generateMirror(), 1500)
    } catch {
      setLoopState({ phase: 'error', message: t('errorGeneric') })
    }
  }

  async function generateMirror() {
    setLoopState({ phase: 'generating' })

    try {
      const res = await fetch('/api/mirror/generate', { method: 'POST' })
      if (!res.ok) {
        setLoopState({ phase: 'error', message: t('errorGeneric') })
        return
      }
      const data = (await res.json()) as { mirror: Mirror }
      setLoopState({ phase: 'revealed', mirror: data.mirror })
    } catch {
      setLoopState({ phase: 'error', message: t('errorGeneric') })
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.set('kind', 'file')
    formData.set('file', file)
    handleCapture(formData)
  }

  return (
    <div
      className="flex flex-col min-h-screen px-6 py-12"
      style={{ background: 'var(--color-lilas-nevoa)' }}
    >
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full gap-8">
        <AnimatePresence mode="wait">
          {loopState.phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-4"
            >
              <p
                className="text-xl font-medium leading-snug text-center"
                style={{ fontFamily: 'Fraunces, serif', color: 'var(--foreground)' }}
              >
                {loopState.prompt}
              </p>

              <p className="text-sm leading-relaxed text-center" style={{ color: 'var(--muted-foreground)' }}>
                {t('importHint')}
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 min-h-[52px]"
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-primary-fg)',
                }}
              >
                {t('ctaLinkedin')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="sr-only"
                onChange={handleFileChange}
                aria-hidden="true"
              />
            </motion.div>
          )}

          {loopState.phase === 'reading' && (
            <motion.div
              key="reading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-full max-w-sm space-y-3" role="status" aria-live="polite">
                <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
                  <motion.div
                    className="h-full w-1/3 rounded-full"
                    style={{ background: 'var(--color-primary)' }}
                    animate={{ x: ['0%', '200%', '0%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <div className="flex justify-between gap-2 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{t('stageRead')}</span>
                  <span>{t('stageOrganize')}</span>
                  <span>{t('stageMirror')}</span>
                </div>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {loadingMessages[msgIndex]}
              </p>
              {isLongWait && (
                <div className="max-w-sm text-center space-y-1.5" aria-live="polite">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {t('longWaitTitle')}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    {t('longWaitBody')}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {loopState.phase === 'reflecting' && (
            <motion.div
              key="reflecting"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-3"
            >
              <p className="text-base leading-relaxed" style={{ color: 'var(--foreground)' }}>
                {loopState.reflection.summary}
              </p>
              {loopState.reflection.pills.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {loopState.reflection.pills.map((pill) => (
                    <li
                      key={pill}
                      className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                    >
                      {pill.replace(/_/g, ' ')}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          {loopState.phase === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-full max-w-sm space-y-3" role="status" aria-live="polite">
                <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
                  <motion.div
                    className="h-full w-1/3 rounded-full"
                    style={{ background: 'var(--color-primary)' }}
                    animate={{ x: ['0%', '200%', '0%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <div className="flex justify-between gap-2 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  <span>{t('stageRead')}</span>
                  <span>{t('stageOrganize')}</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{t('stageMirror')}</span>
                </div>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {loadingMessages[msgIndex]}
              </p>
              {isLongWait && (
                <div className="max-w-sm text-center space-y-1.5" aria-live="polite">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {t('longWaitTitle')}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    {t('longWaitBody')}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {loopState.phase === 'revealed' && (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-col gap-6 rounded-2xl p-6"
              style={{ background: 'var(--card)' }}
            >
              <p className="text-sm font-medium text-center" style={{ color: 'var(--color-primary)' }}>
                Aqui está o que eu vi em você.
              </p>
              <p
                className="text-2xl leading-snug"
                style={{ fontFamily: 'Fraunces, serif', color: 'var(--foreground)' }}
              >
                {loopState.mirror.primary_strength.headline}
              </p>

              {loopState.mirror.strength_themes.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {loopState.mirror.strength_themes.slice(0, 3).map((theme) => (
                    <li
                      key={theme}
                      className="text-sm font-medium px-3 py-1.5 rounded-full"
                      style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                    >
                      {theme}
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => router.push('/espelho')}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 min-h-[48px]"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
              >
                {t('ctaFinal')} →
              </button>
            </motion.div>
          )}

          {loopState.phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                {loopState.message}
              </p>
              <button
                type="button"
                onClick={() =>
                  setLoopState({ phase: 'idle', prompt: t('promptInicial') })
                }
                className="text-sm font-semibold px-4 py-2.5 rounded-lg min-h-[48px]"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
              >
                {t('retry')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
