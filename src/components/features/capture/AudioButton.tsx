'use client'

import { useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AudioRecorder } from './AudioRecorder'

interface AudioButtonProps {
  onTranscript?: (text: string) => void
}

function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as typeof window & {
    SpeechRecognition?: unknown
    webkitSpeechRecognition?: unknown
  }
  return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition)
}

export function AudioButton({ onTranscript }: AudioButtonProps) {
  const t = useTranslations('capture')
  const [open, setOpen] = useState(false)
  const supported = isSpeechRecognitionSupported()

  function handleTranscript(text: string) {
    onTranscript?.(text)
    setOpen(false)
  }

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        aria-label={t('recording.unsupported')}
        title={t('recording.unsupported')}
        className="p-2 rounded-full min-w-[48px] min-h-[48px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <MicOff size={20} />
      </button>
    )
  }

  if (open) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40 lg:bottom-24 lg:left-auto lg:right-6 lg:w-[420px]">
        <AudioRecorder
          onTranscript={handleTranscript}
          onCancel={() => setOpen(false)}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={t('composer.audioAriaLabel')}
      className="p-2 rounded-full min-w-[48px] min-h-[48px] flex items-center justify-center transition-opacity hover:opacity-80"
      style={{ color: 'var(--muted-foreground)' }}
    >
      <Mic size={20} />
    </button>
  )
}
