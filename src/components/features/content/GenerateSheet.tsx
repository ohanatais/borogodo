'use client'

import { useCallback, useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { X, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { DraftFormat, DraftVariant } from '@/types/content'
import { DraftCard } from './DraftCard'
import { VoiceCalibration } from './VoiceCalibration'
import { PRESENCA_OPEN_EVENT, type PresencaOpenDetail } from './presencaEvents'

type Status = 'idle' | 'generating' | 'done' | 'error'
type ErrorKind = 'generationFailed' | 'generic'

const FORMAT_LABEL_KEY: Record<DraftFormat, string> = {
  post: 'formats.post',
  impact_summary: 'formats.impactSummary',
}

/** Linhas shimmer durante a geração — animação, não spinner (shape). */
function GeneratingState({ label }: { label: string }) {
  const widths = ['100%', '92%', '78%']
  return (
    <div aria-live="polite" className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
        {label}
      </p>
      <div className="flex flex-col gap-2" aria-hidden="true">
        {widths.map((w) => (
          <div key={w} className="h-3 rounded-full animate-pulse" style={{ background: 'var(--muted)', width: w }} />
        ))}
      </div>
    </div>
  )
}

/**
 * Superfície de geração (T020). Abre com a evidência carregada (nunca página em branco), oferece os
 * formatos do seed, mostra a animação de escrita e os 2 rascunhos. Radix Dialog dá foco preso + ESC.
 * Montada uma vez no AppShell; reusada por 014/015.
 */
export function GenerateSheet() {
  const t = useTranslations('presenca')
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<PresencaOpenDetail | null>(null)
  const [format, setFormat] = useState<DraftFormat>('post')
  const [status, setStatus] = useState<Status>('idle')
  const [variants, setVariants] = useState<DraftVariant[]>([])
  const [errorKind, setErrorKind] = useState<ErrorKind>('generic')

  const generate = useCallback(
    async (seed: PresencaOpenDetail, fmt: DraftFormat) => {
      setStatus('generating')
      try {
        const res = await fetch('/api/content/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: fmt, seedType: seed.seedType, seedRef: seed.seedRef }),
        })

        if (!res.ok) {
          setErrorKind(res.status === 422 ? 'generationFailed' : 'generic')
          setStatus('error')
          return
        }

        const body = (await res.json()) as { variants: DraftVariant[] }
        setVariants(body.variants)
        setStatus('done')
      } catch {
        setErrorKind('generic')
        setStatus('error')
      }
    },
    []
  )

  useEffect(() => {
    function handler(e: Event) {
      const next = (e as CustomEvent<PresencaOpenDetail>).detail
      if (!next) return
      const initialFormat = next.formats[0] ?? 'post'
      setDetail(next)
      setFormat(initialFormat)
      setVariants([])
      setOpen(true)
      void generate(next, initialFormat)
    }
    window.addEventListener(PRESENCA_OPEN_EVENT, handler)
    return () => window.removeEventListener(PRESENCA_OPEN_EVENT, handler)
  }, [generate])

  function handleFormatChange(next: DraftFormat) {
    if (!detail || next === format) return
    setFormat(next)
    void generate(detail, next)
  }

  function handleRegenerate() {
    if (detail) void generate(detail, format)
  }

  if (!detail) return null

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: 'oklch(18% 0.02 260 / 0.4)', backdropFilter: 'blur(2px)' }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed z-50 flex flex-col focus:outline-none overflow-hidden
            bottom-0 left-0 right-0 rounded-t-[20px] h-[88dvh]
            lg:inset-y-6 lg:right-6 lg:left-auto lg:w-[560px] lg:h-auto lg:rounded-2xl"
          style={{
            background: 'var(--color-creme)',
            boxShadow: '0 8px 40px oklch(18% 0.02 260 / 0.25)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full min-h-0"
          >
            {/* Header: evidência base (a prova de que não é template, primeiro) */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="min-w-0">
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {t('basedOn')}
                </p>
                <Dialog.Title className="text-base font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                  {detail.seedSummary}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label={t('errors.generic')}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            {/* Seletor de formato (quando o seed oferece mais de um) */}
            {detail.formats.length > 1 && (
              <div className="flex gap-2 px-5 pt-4 shrink-0" role="tablist" aria-label={t('angleLabel')}>
                {detail.formats.map((fmt) => {
                  const active = fmt === format
                  return (
                    <button
                      key={fmt}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleFormatChange(fmt)}
                      className="text-sm px-3 py-1.5 rounded-full transition-colors"
                      style={{
                        background: active ? 'var(--color-primary)' : 'var(--muted)',
                        color: active ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
                      }}
                    >
                      {t(FORMAT_LABEL_KEY[fmt])}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Conteúdo: animação de escrita, rascunhos, ou erro honesto */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">
              {status === 'generating' && <GeneratingState label={t('generating')} />}

              {status === 'error' && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium" style={{ color: 'var(--destructive)' }}>
                    {errorKind === 'generationFailed' ? t('errors.generationFailed') : t('errors.generic')}
                  </p>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="self-start inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg"
                    style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                  >
                    <RefreshCw size={14} />
                    {t('regenerate')}
                  </button>
                </div>
              )}

              {status === 'done' &&
                variants.map((variant, i) => <DraftCard key={i} variant={variant} index={i} />)}
            </div>

            {/* Rodapé: regerar + afinar voz (refino discreto) */}
            {status === 'done' && (
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
                <VoiceCalibration onSaved={handleRegenerate} />
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
                >
                  <RefreshCw size={14} />
                  {t('regenerate')}
                </button>
              </div>
            )}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
