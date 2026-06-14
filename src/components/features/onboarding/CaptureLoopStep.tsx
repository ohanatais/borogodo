'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { Reflection } from '@/types/capture'
import type { Mirror } from '@/types/mirror'
import type { SufficiencyResult } from '@/lib/ai/mirror/evaluateSufficiency'

const MAX_FOLLOW_UPS = 3

type LoopPhase =
  | { phase: 'idle'; prompt: string }
  | { phase: 'reading' }
  | { phase: 'reflecting'; reflection: Reflection }
  | { phase: 'evaluating' }
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
  const [roundCount, setRoundCount] = useState(0)
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleCapture(formData: FormData) {
    setLoopState({ phase: 'reading' })
    setText('')

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
        await runEvaluate()
        return
      }

      setLoopState({ phase: 'reflecting', reflection: data.reflection })

      setTimeout(() => runEvaluate(), 1500)
    } catch {
      setLoopState({ phase: 'error', message: t('errorGeneric') })
    }
  }

  async function runEvaluate() {
    setLoopState({ phase: 'evaluating' })

    const newRound = roundCount + 1
    setRoundCount(newRound)

    if (newRound > MAX_FOLLOW_UPS) {
      await generateMirror()
      return
    }

    try {
      const res = await fetch('/api/onboarding/evaluate', { method: 'POST' })
      if (!res.ok) {
        await generateMirror()
        return
      }
      const result = (await res.json()) as SufficiencyResult

      if (result.sufficient) {
        await generateMirror()
      } else {
        setLoopState({ phase: 'idle', prompt: result.follow_up_prompt })
      }
    } catch {
      await generateMirror()
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

  function handleTextSubmit() {
    if (!text.trim()) return
    const formData = new FormData()
    formData.set('kind', 'text')
    formData.set('content', text.trim())
    handleCapture(formData)
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
      style={{ background: 'var(--color-creme)' }}
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
                className="text-lg font-medium leading-snug"
                style={{ fontFamily: 'Fraunces, serif', color: 'var(--foreground)' }}
              >
                {loopState.prompt}
              </p>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('placeholder')}
                rows={4}
                className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none focus-visible:ring-2"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleTextSubmit()
                }}
              />

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleTextSubmit}
                  disabled={!text.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40 min-h-[48px]"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                >
                  {t('cta')}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 min-h-[48px]"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--muted-foreground)',
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
              </div>
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
              <span
                className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{
                  borderColor: 'var(--color-primary)',
                  borderTopColor: 'transparent',
                }}
              />
              <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {t('reading')}
              </p>
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

          {loopState.phase === 'evaluating' && (
            <motion.div
              key="evaluating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <span
                className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{
                  borderColor: 'var(--color-primary)',
                  borderTopColor: 'transparent',
                }}
              />
              <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {t('evaluating')}
              </p>
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
              <span
                className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{
                  borderColor: 'var(--color-primary)',
                  borderTopColor: 'transparent',
                }}
              />
              <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {t('generating')}
              </p>
            </motion.div>
          )}

          {loopState.phase === 'revealed' && (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex flex-col gap-6 rounded-2xl p-6"
              style={{ background: 'var(--color-lilas-nevoa)' }}
            >
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
