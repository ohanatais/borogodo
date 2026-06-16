'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechState = 'idle' | 'listening' | 'stopped' | 'permission-denied'

// Web Speech API types — not universally available in all TS lib versions
interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  addEventListener(type: string, listener: (event: unknown) => void): void
  removeEventListener(type: string, listener: (event: unknown) => void): void
}

interface SpeechResultEvent {
  results: { [index: number]: [{ transcript: string }]; length: number }
  resultIndex: number
}

interface SpeechErrorEvent {
  error: string
}

export interface UseSpeechRecognitionReturn {
  supported: boolean
  state: SpeechState
  transcript: string
  lastError: string | null
  start: () => void
  stop: () => void
  cancel: () => void
  rerecord: () => void
}

function getSpeechRecognitionConstructor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === 'undefined') return null
  const w = window as typeof window & {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const Constructor = getSpeechRecognitionConstructor()
  const supported = Constructor !== null

  const [state, setState] = useState<SpeechState>('idle')
  const [transcript, setTranscript] = useState('')
  const [lastError, setLastError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const cleanup = useCallback(() => {
    const rec = recognitionRef.current
    if (rec) {
      rec.abort()
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  const createAndStart = useCallback(() => {
    if (!Constructor) return

    cleanup()

    let rec: SpeechRecognitionLike
    try {
      rec = new Constructor()
    } catch {
      setState('stopped')
      return
    }

    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'pt-BR'

    rec.addEventListener('result', (event: unknown) => {
      const e = event as SpeechResultEvent
      let full = ''
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0]?.transcript ?? ''
      }
      setTranscript(full)
    })

    rec.addEventListener('error', (event: unknown) => {
      const e = event as SpeechErrorEvent
      setLastError(e.error)
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setState('permission-denied')
      } else {
        setState('stopped')
      }
      recognitionRef.current = null
    })

    rec.addEventListener('end', () => {
      setState((prev) => (prev === 'listening' ? 'stopped' : prev))
      recognitionRef.current = null
    })

    recognitionRef.current = rec
    setLastError(null)
    setState('listening')
    try {
      rec.start()
    } catch {
      setState('stopped')
      recognitionRef.current = null
      return
    }
  }, [Constructor, cleanup])

  const start = useCallback(() => {
    if (!supported) return
    setTranscript('')
    createAndStart()
  }, [supported, createAndStart])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setState('stopped')
  }, [])

  const cancel = useCallback(() => {
    cleanup()
    setTranscript('')
    setState('idle')
  }, [cleanup])

  const rerecord = useCallback(() => {
    setTranscript('')
    createAndStart()
  }, [createAndStart])

  return { supported, state, transcript, lastError, start, stop, cancel, rerecord }
}
