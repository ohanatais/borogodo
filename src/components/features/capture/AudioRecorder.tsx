'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Mic, Square, X, RotateCcw } from 'lucide-react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

interface AudioRecorderProps {
  onTranscript: (text: string) => void
  onCancel: () => void
}

export function AudioRecorder({ onTranscript, onCancel }: AudioRecorderProps) {
  const t = useTranslations('capture')
  const { supported, state, transcript, lastError, start, stop, cancel, rerecord } = useSpeechRecognition()
  const liveRegionRef = useRef<HTMLDivElement>(null)

  function handleStop() {
    stop()
  }

  function handleCancel() {
    cancel()
    onCancel()
  }

  function handleRerecord() {
    rerecord()
  }

  function handleUse() {
    if (transcript.trim()) {
      onTranscript(transcript.trim())
    } else {
      onCancel()
    }
  }

  if (!supported) {
    return (
      <div
        role="alert"
        className="rounded-xl px-4 py-3 text-sm"
        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
      >
        {t('recording.unsupported')}
      </div>
    )
  }

  if (state === 'permission-denied') {
    return (
      <div
        role="alert"
        className="rounded-xl px-4 py-3 text-sm"
        style={{ background: 'var(--muted)', color: 'oklch(55% 0.22 25)' }}
      >
        {t('recording.permissionDenied')}
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-xl px-4 py-3"
      style={{ background: 'var(--muted)' }}
    >
      {/* Hidden aria-live anchor always in DOM for screen readers */}
      <div ref={liveRegionRef} aria-live="polite" aria-label={t('recording.liveRegionLabel')} className="sr-only" />

      {/* Live transcript / listening indicator — only rendered when active */}
      {state !== 'idle' && (
        <div className="min-h-[3rem] text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
          {state === 'listening' && !transcript && (
            <span className="inline-flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: 'oklch(65% 0.2 30)', animationDuration: '1.5s' }}
                aria-hidden="true"
              />
              {t('recording.listening')}
            </span>
          )}
          {transcript && <span>{transcript}</span>}
          {state === 'stopped' && !transcript && (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {lastError === 'audio-capture'
                ? t('recording.errorAudioCapture')
                : lastError === 'network'
                ? t('recording.errorNetwork')
                : lastError
                ? t('recording.errorGeneric')
                : t('recording.noSpeech')}
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap" role="group" aria-label={t('recording.controlsGroupLabel')}>
        {state === 'idle' && (
          <>
            <button
              type="button"
              onClick={() => start()}
              aria-label={t('recording.startAriaLabel')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold min-h-[44px]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
            >
              <Mic size={14} aria-hidden="true" />
              {t('recording.start')}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              aria-label={t('recording.cancelAriaLabel')}
              className="px-3 py-2 rounded-full text-sm min-h-[44px]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {t('recording.cancel')}
            </button>
          </>
        )}

        {state === 'listening' && (
          <>
            <button
              type="button"
              onClick={handleStop}
              aria-label={t('recording.stopAriaLabel')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium min-h-[44px]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
            >
              <Square size={14} aria-hidden="true" />
              {t('recording.stop')}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              aria-label={t('recording.cancelAriaLabel')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium min-h-[44px]"
              style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
            >
              <X size={14} aria-hidden="true" />
              {t('recording.cancel')}
            </button>
          </>
        )}

        {state === 'stopped' && (
          <>
            {transcript.trim() && (
              <button
                type="button"
                onClick={handleUse}
                aria-label={t('recording.useAriaLabel')}
                className="px-4 py-2 rounded-full text-sm font-semibold min-h-[44px]"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
              >
                {t('recording.use')}
              </button>
            )}
            <button
              type="button"
              onClick={handleRerecord}
              aria-label={t('recording.rerecordAriaLabel')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium min-h-[44px]"
              style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
            >
              <RotateCcw size={14} aria-hidden="true" />
              {t('recording.rerecord')}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              aria-label={t('recording.cancelAriaLabel')}
              className="px-3 py-2 rounded-full text-sm min-h-[44px]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {t('recording.cancel')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
